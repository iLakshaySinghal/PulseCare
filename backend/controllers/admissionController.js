import Admission from '../models/Admission.js';
import Room from '../models/Room.js';
import Bed from '../models/Bed.js';
import Ward from '../models/Ward.js';
import Patient from '../models/Patient.js';
import auditService from '../services/auditService.js';
import { getIO } from '../config/socket.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/appError.js';
import logger from '../config/logger.js';

// Helper to generate Admission ID: ADM-YYYYMMDD-XXXX
const generateAdmissionId = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${dateStr}-${randomSuffix}`;
};

/**
 * POST /api/v1/admissions
 */
export const createAdmission = async (req, res, next) => {
  const { patientId, roomId, bedId, reason, diagnosis } = req.body;

  if (!patientId || !roomId || !bedId || !reason) {
    return next(new ValidationError('patientId, roomId, bedId and reason are required'));
  }

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new NotFoundError('Patient not found'));
  }

  // Check if patient is already admitted
  const activeAdmission = await Admission.findOne({ patientId, status: 'Admitted' });
  if (activeAdmission) {
    return next(new ConflictError('Patient is already admitted in another ward/bed'));
  }

  // Check if room and bed exist and bed is vacant
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new NotFoundError('Room not found'));
  }

  const bed = await Bed.findById(bedId);
  if (!bed) {
    return next(new NotFoundError('Bed not found'));
  }

  if (bed.isOccupied) {
    return next(new ConflictError('The selected bed is already occupied'));
  }

  // Generate admission details
  const admissionId = await generateAdmissionId();

  const admission = await Admission.create({
    admissionId,
    patientId,
    roomId,
    bedId,
    reason,
    diagnosis: diagnosis || '',
    admittedBy: req.user.id,
    admissionDate: new Date(),
    status: 'Admitted',
    billingStatus: 'Pending'
  });

  // Mark bed as occupied
  bed.isOccupied = true;
  await bed.save();

  // Audit log
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'INPATIENT_ADMISSION',
    resource: 'Admission',
    resourceId: admission._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: { before: null, after: admission.toObject() }
  });

  // Emit WebSocket notification
  try {
    const io = getIO();
    io.emit('bed_status_updated', { bedId: bed._id, isOccupied: true });
    io.to('role_Nurse').emit('live_admission_update');
    io.to('role_Hospital Admin').emit('live_kpi_update');
  } catch (err) {
    logger.debug(`Socket emit for bed status update failed: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Patient admitted successfully',
    data: admission
  });
};

/**
 * POST /api/v1/admissions/:id/vitals
 */
export const addVitalsLog = async (req, res, next) => {
  const { id } = req.params;
  const { bloodPressure, heartRate, temperature } = req.body;

  if (!bloodPressure || !heartRate || !temperature) {
    return next(new ValidationError('bloodPressure, heartRate and temperature are required'));
  }

  const admission = await Admission.findById(id);
  if (!admission) {
    return next(new NotFoundError('Admission record not found'));
  }

  if (admission.status !== 'Admitted') {
    return next(new ConflictError('Cannot log vitals for a discharged patient'));
  }

  admission.vitalsLog.push({
    bloodPressure,
    heartRate,
    temperature,
    recordedAt: new Date(),
    recordedBy: req.user.id
  });

  await admission.save();

  res.status(200).json({
    success: true,
    message: 'Inpatient vitals recorded successfully',
    data: admission
  });
};

/**
 * POST /api/v1/admissions/:id/treatment
 */
export const addTreatmentLog = async (req, res, next) => {
  const { id } = req.params;
  const { treatmentNote } = req.body;

  if (!treatmentNote) {
    return next(new ValidationError('treatmentNote is required'));
  }

  const admission = await Admission.findById(id);
  if (!admission) {
    return next(new NotFoundError('Admission record not found'));
  }

  if (admission.status !== 'Admitted') {
    return next(new ConflictError('Cannot log treatment for a discharged patient'));
  }

  admission.treatmentLog.push({
    treatmentNote,
    administeredAt: new Date(),
    administeredBy: req.user.id
  });

  await admission.save();

  res.status(200).json({
    success: true,
    message: 'Treatment note appended successfully',
    data: admission
  });
};

/**
 * POST /api/v1/admissions/:id/discharge
 */
export const dischargePatient = async (req, res, next) => {
  const { id } = req.params;
  const { conditionAtDischarge, treatmentSummary, followUpInstructions } = req.body;

  if (!conditionAtDischarge || !treatmentSummary) {
    return next(new ValidationError('conditionAtDischarge and treatmentSummary are required'));
  }

  const admission = await Admission.findById(id);
  if (!admission) {
    return next(new NotFoundError('Admission record not found'));
  }

  if (admission.status === 'Discharged') {
    return next(new ConflictError('Patient is already discharged'));
  }

  const beforeState = admission.toObject();

  // Update admission details
  admission.status = 'Discharged';
  admission.dischargeDate = new Date();
  admission.dischargedBy = req.user.id;
  admission.dischargeSummary = {
    conditionAtDischarge,
    treatmentSummary,
    followUpInstructions: followUpInstructions || ''
  };

  await admission.save();

  // Free up the bed
  const bed = await Bed.findById(admission.bedId);
  if (bed) {
    bed.isOccupied = false;
    await bed.save();
  }

  // Audit log
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'INPATIENT_DISCHARGE',
    resource: 'Admission',
    resourceId: admission._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: { before: beforeState, after: admission.toObject() }
  });

  // Emit WebSocket notification
  try {
    const io = getIO();
    if (bed) {
      io.emit('bed_status_updated', { bedId: bed._id, isOccupied: false });
    }
    io.to('role_Nurse').emit('live_admission_update');
    io.to('role_Hospital Admin').emit('live_kpi_update');
  } catch (err) {
    logger.debug(`Socket emit for bed status update on discharge failed: ${err.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'Patient discharged successfully',
    data: admission
  });
};

/**
 * GET /api/v1/admissions
 */
export const listAdmissions = async (req, res, next) => {
  const { page = 1, limit = 10, status, search = '' } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  // If patient role, limit query to self
  if (req.user.role === 'Patient') {
    const patientProfile = await Patient.findOne({ userId: req.user.id });
    if (!patientProfile) {
      return res.status(200).json({
        success: true,
        data: { admissions: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } }
      });
    }
    query.patientId = patientProfile._id;
  }

  let admissions = await Admission.find(query)
    .populate('patientId', 'firstName lastName patientId gender dateOfBirth contactNumber')
    .populate('roomId', 'roomNumber roomType chargesPerDay')
    .populate('bedId', 'bedNumber')
    .populate('admittedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  if (search && req.user.role !== 'Patient') {
    // Filter matching patient name in memory, or use populated field
    admissions = admissions.filter(adm => {
      const name = `${adm.patientId?.firstName || ''} ${adm.patientId?.lastName || ''}`.toLowerCase();
      const pid = (adm.patientId?.patientId || '').toLowerCase();
      const term = search.toLowerCase();
      return name.includes(term) || pid.includes(term) || adm.admissionId.toLowerCase().includes(term);
    });
  }

  const total = await Admission.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      admissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
};

/**
 * GET /api/v1/admissions/:id
 */
export const getAdmissionById = async (req, res, next) => {
  const { id } = req.params;
  const admission = await Admission.findById(id)
    .populate('patientId')
    .populate('roomId')
    .populate('bedId')
    .populate('admittedBy', 'firstName lastName email')
    .populate('vitalsLog.recordedBy', 'firstName lastName')
    .populate('treatmentLog.recordedBy', 'firstName lastName');

  if (!admission) {
    return next(new NotFoundError('Admission record not found'));
  }

  res.status(200).json({
    success: true,
    data: admission
  });
};

/**
 * GET /api/v1/admissions/wards
 */
export const listWards = async (req, res, next) => {
  const wards = await Ward.find({});
  res.status(200).json({ success: true, data: wards });
};

/**
 * POST /api/v1/admissions/wards
 */
export const createWard = async (req, res, next) => {
  const { name, department } = req.body;
  const ward = await Ward.create({ name, department });
  res.status(201).json({ success: true, data: ward });
};

/**
 * GET /api/v1/admissions/rooms
 */
export const listRooms = async (req, res, next) => {
  const rooms = await Room.find({}).populate('wardId');
  res.status(200).json({ success: true, data: rooms });
};

/**
 * POST /api/v1/admissions/rooms
 */
export const createRoom = async (req, res, next) => {
  const { roomNumber, wardId, roomType, chargesPerDay } = req.body;
  const room = await Room.create({ roomNumber, wardId, roomType, chargesPerDay });
  res.status(201).json({ success: true, data: room });
};

/**
 * GET /api/v1/admissions/beds
 */
export const listBeds = async (req, res, next) => {
  const beds = await Bed.find({}).populate('roomId');
  res.status(200).json({ success: true, data: beds });
};

/**
 * POST /api/v1/admissions/beds
 */
export const createBed = async (req, res, next) => {
  const { bedNumber, roomId } = req.body;
  const bed = await Bed.create({ bedNumber, roomId });

  // Increment total beds count in ward
  const room = await Room.findById(roomId);
  if (room) {
    await Ward.findByIdAndUpdate(room.wardId, { $inc: { totalBeds: 1 } });
  }

  res.status(201).json({ success: true, data: bed });
};
