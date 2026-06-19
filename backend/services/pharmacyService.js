import Medicine from '../models/Medicine.js';
import Inventory from '../models/Inventory.js';
import DispenseRecord from '../models/DispenseRecord.js';
import EMR from '../models/EMR.js';
import auditService from './auditService.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';
import logger from '../config/logger.js';
import { getIO } from '../config/socket.js';

/**
 * Adds a new medicine to the master catalog
 */
export const registerMedicine = async (medicineData) => {
  const existing = await Medicine.findOne({ name: medicineData.name });
  if (existing) {
    throw new ConflictError('A medicine with this name already exists in the master catalog');
  }

  const medicine = await Medicine.create(medicineData);
  return medicine;
};

/**
 * Adds stock batch to inventory
 */
export const addStock = async (stockData, userId) => {
  const medicine = await Medicine.findById(stockData.medicineId);
  if (!medicine) {
    throw new NotFoundError('Medicine not found in catalog');
  }

  // Check if batch number already exists for this medicine
  const existingBatch = await Inventory.findOne({
    medicineId: stockData.medicineId,
    batchNumber: stockData.batchNumber
  });
  if (existingBatch) {
    throw new ConflictError(
      `A stock batch with number '${stockData.batchNumber}' already exists for this medicine.`
    );
  }

  const inventory = await Inventory.create(stockData);

  // Log Audit
  await auditService.logAuditEvent({
    userId,
    action: 'PHARMACY_STOCK_ADD',
    resource: 'Inventory',
    resourceId: inventory._id,
    changes: { before: null, after: inventory.toObject() }
  });

  return inventory;
};

/**
 * Fetches the queue of prescriptions pending dispensing.
 * Scans EMR files and returns records that haven't been completed in DispenseRecords.
 */
export const getDispensingQueue = async () => {
  // Find all EMR IDs that are already fully dispensed
  const dispensedEmrIds = await DispenseRecord.find({ status: 'Dispensed' }).distinct('emrId');

  // Find EMR entries with prescriptions that have not been dispensed
  const queue = await EMR.find({
    _id: { $nin: dispensedEmrIds },
    'prescriptions.0': { $exists: true }
  })
    .populate('patientId')
    .populate('providerId', 'firstName lastName')
    .sort({ encounterDate: -1 });

  return queue;
};

/**
 * Dispenses a prescription, reduces inventory, and records details
 */
export const dispensePrescription = async ({ emrId, dispensedMedicines, pharmacistId }) => {
  const emr = await EMR.findById(emrId).populate('patientId');
  if (!emr) {
    throw new NotFoundError('Prescription EMR record not found');
  }

  // Double check if already dispensed
  const existingRecord = await DispenseRecord.findOne({ emrId, status: 'Dispensed' });
  if (existingRecord) {
    throw new ConflictError('This prescription has already been dispensed');
  }

  // 1. Process and decrement stock inside Transaction or sequential checks
  // (We use a safe loop to decrement stock batch-by-batch)
  const itemsLog = [];

  for (const item of dispensedMedicines) {
    const { medicineId, quantity, batchNumber } = item;

    const inventoryEntry = await Inventory.findOne({ medicineId, batchNumber });
    if (!inventoryEntry) {
      throw new NotFoundError(`Stock batch ${batchNumber} not found for medicine`);
    }

    if (inventoryEntry.stock < quantity) {
      throw new ConflictError(
        `Insufficient stock in batch ${batchNumber}. Available: ${inventoryEntry.stock}, Requested: ${quantity}`
      );
    }

    // Decrement stock
    inventoryEntry.stock -= quantity;
    await inventoryEntry.save();

    itemsLog.push({
      medicineId,
      quantity,
      batchNumber
    });
  }

  // 2. Create Dispense Record
  const dispenseRecord = await DispenseRecord.create({
    emrId,
    patientId: emr.patientId._id,
    pharmacistId,
    dispensedMedicines: itemsLog,
    status: 'Dispensed'
  });

  // 3. Log Audit
  await auditService.logAuditEvent({
    userId: pharmacistId,
    action: 'PHARMACY_DISPENSE',
    resource: 'DispenseRecord',
    resourceId: dispenseRecord._id,
    changes: { before: null, after: dispenseRecord.toObject() }
  });

  // 4. Socket event to notify pharmacy queue updates
  try {
    const io = getIO();
    io.to('role_Pharmacist').emit('prescription_dispensed', {
      emrId,
      dispenseRecordId: dispenseRecord._id
    });
  } catch (err) {
    logger.error(`Socket broadcast fail in dispensePrescription: ${err.message}`);
  }

  return dispenseRecord;
};

/**
 * Deletes an inventory stock batch by ID
 */
export const deleteInventory = async (inventoryId, userId) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new NotFoundError('Inventory stock batch not found');
  }

  await Inventory.findByIdAndDelete(inventoryId);

  // Log Audit
  await auditService.logAuditEvent({
    userId,
    action: 'PHARMACY_STOCK_DELETE',
    resource: 'Inventory',
    resourceId: inventoryId,
    changes: { before: inventory.toObject(), after: null }
  });

  return { success: true };
};

/**
 * Deletes a medicine from catalog with relational check and cascade delete of stock
 */
export const deleteMedicine = async (medicineId, userId) => {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new NotFoundError('Medicine not found in catalog');
  }

  // Check relational integrity constraints
  const hasDispensed = await DispenseRecord.findOne({ 'dispensedMedicines.medicineId': medicineId });
  if (hasDispensed) {
    throw new ConflictError('Cannot delete medicine: historical dispensing logs reference this medicine');
  }

  // Cascade delete associated inventory stock batches
  await Inventory.deleteMany({ medicineId });

  await Medicine.findByIdAndDelete(medicineId);

  // Log Audit
  await auditService.logAuditEvent({
    userId,
    action: 'PHARMACY_MEDICINE_DELETE',
    resource: 'Medicine',
    resourceId: medicineId,
    changes: { before: medicine.toObject(), after: null }
  });

  return { success: true };
};

export default {
  registerMedicine,
  addStock,
  getDispensingQueue,
  dispensePrescription,
  deleteMedicine,
  deleteInventory
};
