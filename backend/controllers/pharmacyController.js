import pharmacyService from '../services/pharmacyService.js';
import Medicine from '../models/Medicine.js';
import Inventory from '../models/Inventory.js';
import DispenseRecord from '../models/DispenseRecord.js';
import { NotFoundError } from '../utils/appError.js';

export const registerMedicine = async (req, res, next) => {
  try {
    const medicine = await pharmacyService.registerMedicine(req.body);
    res.status(201).json({
      success: true,
      message: 'Medicine registered in catalog',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

export const listMedicines = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 });
    res.status(200).json({
      success: true,
      message: 'Medicines retrieved successfully',
      data: medicines
    });
  } catch (err) {
    next(err);
  }
};

export const addStock = async (req, res, next) => {
  try {
    const stock = await pharmacyService.addStock(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Stock batch added to inventory successfully',
      data: stock
    });
  } catch (err) {
    next(err);
  }
};

export const listInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find()
      .populate('medicineId')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      message: 'Inventory records retrieved successfully',
      data: inventory
    });
  } catch (err) {
    next(err);
  }
};

export const getDispensingQueue = async (req, res, next) => {
  try {
    const queue = await pharmacyService.getDispensingQueue();
    res.status(200).json({
      success: true,
      message: 'Pharmacy dispensing queue retrieved',
      data: queue
    });
  } catch (err) {
    next(err);
  }
};

export const dispensePrescription = async (req, res, next) => {
  try {
    const { emrId, dispensedMedicines } = req.body;
    const pharmacistId = req.user.id;

    const dispenseRecord = await pharmacyService.dispensePrescription({
      emrId,
      dispensedMedicines,
      pharmacistId
    });

    res.status(200).json({
      success: true,
      message: 'Prescription verified and dispensed successfully',
      data: dispenseRecord
    });
  } catch (err) {
    next(err);
  }
};

export const getDispensedRecords = async (req, res, next) => {
  try {
    const records = await DispenseRecord.find()
      .populate('patientId', 'firstName lastName patientId')
      .populate('pharmacistId', 'firstName lastName')
      .populate('dispensedMedicines.medicineId')
      .sort({ dispensedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Dispensing history logs retrieved',
      data: records
    });
  } catch (err) {
    next(err);
  }
};

export default {
  registerMedicine,
  listMedicines,
  addStock,
  listInventory,
  getDispensingQueue,
  dispensePrescription,
  getDispensedRecords
};
