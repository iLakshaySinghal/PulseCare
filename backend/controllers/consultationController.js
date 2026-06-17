import consultationService from '../services/consultationService.js';
import Consultation from '../models/Consultation.js';

export const startConsultation = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    const doctorId = req.user.id;
    const consultation = await consultationService.startConsultation(appointmentId, doctorId);

    res.status(201).json({
      success: true,
      message: 'Consultation workspace initiated',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

export const updateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const consultation = await consultationService.updateConsultationDraft(id, doctorId, req.body);

    res.status(200).json({
      success: true,
      message: 'Consultation draft saved successfully',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

export const completeConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const consultation = await consultationService.completeConsultation(id, doctorId);

    res.status(200).json({
      success: true,
      message: 'Consultation finalized and synced to EMR successfully',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id)
      .populate('patientId')
      .populate('doctorId', 'firstName lastName email')
      .populate('appointmentId');

    res.status(200).json({
      success: true,
      message: 'Consultation retrieved successfully',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientConsultations = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const consultations = await Consultation.find({ patientId })
      .populate('doctorId', 'firstName lastName email')
      .sort({ encounterDate: -1 });

    res.status(200).json({
      success: true,
      message: 'Patient consultations history retrieved',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

export default {
  startConsultation,
  updateConsultation,
  completeConsultation,
  getConsultationById,
  getPatientConsultations
};
