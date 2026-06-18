import appointmentService from '../services/appointmentService.js';
import Appointment from '../models/Appointment.js';
import DoctorAvailability from '../models/DoctorAvailability.js';
import User from '../models/User.js';
import { NotFoundError } from '../utils/appError.js';

export const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, slot, reason } = req.body;
    const appointment = await appointmentService.createAppointment({
      patientId,
      doctorId,
      appointmentDate,
      slot,
      reason,
      createdBy: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Appointment requested successfully',
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;
    const appointment = await appointmentService.updateAppointmentStatus(id, status, cancellationReason, req.user);

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

export const setAvailability = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'Doctor' ? req.user.id : req.body.doctorId;
    const { dayOfWeek, slots } = req.body;
    const availability = await appointmentService.setDoctorAvailability(doctorId, { dayOfWeek, slots });

    res.status(200).json({
      success: true,
      message: 'Doctor availability configured successfully',
      data: availability
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const availability = await DoctorAvailability.find({ doctorId });

    res.status(200).json({
      success: true,
      message: 'Doctor availability retrieved successfully',
      data: availability
    });
  } catch (err) {
    next(err);
  }
};

export const listAppointments = async (req, res, next) => {
  try {
    const { doctorId, patientId, status, date, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Patient filter rules: if user is Patient, restrict query strictly to their records
    if (req.user.role === 'Patient') {
      // Find patient document linked to user ID
      const patient = await Appointment.db.model('Patient').findOne({ userId: req.user.id });
      if (!patient) {
        throw new NotFoundError('Associated patient profile not found.');
      }
      query.patientId = patient._id;
    } else {
      if (patientId) query.patientId = patientId;
      if (doctorId) query.doctorId = doctorId;
    }

    // Doctor filter rules: doctors see their own schedules by default unless overridden
    if (req.user.role === 'Doctor' && !doctorId) {
      query.doctorId = req.user.id;
    }

    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName patientId contactNumber')
      .populate('doctorId', 'firstName lastName email')
      .sort({ appointmentDate: 1, 'slot.startTime': 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Appointments list retrieved successfully',
      data: {
        appointments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorsList = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'Doctor', isActive: true }, 'firstName lastName email');
    res.status(200).json({
      success: true,
      message: 'Doctors list retrieved successfully',
      data: doctors
    });
  } catch (err) {
    next(err);
  }
};

export const getNursesList = async (req, res, next) => {
  try {
    const nurses = await User.find({ role: 'Nurse', isActive: true }, 'firstName lastName email');
    res.status(200).json({
      success: true,
      message: 'Nurses list retrieved successfully',
      data: nurses
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createAppointment,
  updateAppointmentStatus,
  setAvailability,
  getDoctorAvailability,
  listAppointments,
  getDoctorsList,
  getNursesList
};
