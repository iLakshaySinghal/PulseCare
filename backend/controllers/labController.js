import labService from '../services/labService.js';
import LabRequest from '../models/LabRequest.js';
import LabReport from '../models/LabReport.js';
import { uploadFileStream } from '../services/storageService.js';
import { NotFoundError, ValidationError } from '../utils/appError.js';

export const createLabRequest = async (req, res, next) => {
  try {
    const { patientId, testType, instructions } = req.body;
    const doctorId = req.user.id;

    const request = await labService.createLabRequest({
      patientId,
      doctorId,
      testType,
      instructions
    });

    res.status(201).json({
      success: true,
      message: 'Lab test ordered successfully',
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const listLabRequests = async (req, res, next) => {
  try {
    const { status, patientId, testType } = req.query;
    const query = {};

    if (req.user.role === 'Patient') {
      const patient = await LabRequest.db.model('Patient').findOne({ userId: req.user.id });
      if (!patient) {
        throw new NotFoundError('Associated patient profile not found');
      }
      query.patientId = patient._id;
    } else {
      if (patientId) query.patientId = patientId;
    }

    if (status) query.status = status;
    if (testType) query.testType = testType;

    const requests = await LabRequest.find(query)
      .populate('patientId', 'firstName lastName patientId contactNumber')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Lab requests retrieved successfully',
      data: requests
    });
  } catch (err) {
    next(err);
  }
};

export const updateLabRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, sampleDetails } = req.body;
    const userId = req.user.id;

    const request = await labService.updateRequestStatus(id, status, sampleDetails, userId);

    res.status(200).json({
      success: true,
      message: `Lab request status updated to ${status}`,
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const uploadReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { results } = req.body;
    const uploadedBy = req.user.id;

    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName;
    let fileType = req.body.fileType;

    if (req.file) {
      const uploadResult = await uploadFileStream(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileUrl = uploadResult.fileUrl;
      fileName = uploadResult.fileName;
      fileType = req.file.mimetype;
    }

    if (!fileUrl) {
      throw new ValidationError('File upload is required for report submission');
    }

    const report = await labService.uploadLabReport({
      requestId: id,
      fileUrl,
      fileName: fileName || 'report.pdf',
      fileType: fileType || 'application/pdf',
      results,
      uploadedBy
    });

    res.status(200).json({
      success: true,
      message: 'Report uploaded and test completed successfully',
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export const reviewReport = async (req, res, next) => {
  try {
    const { id } = req.params; // report ID
    const { reviewNotes } = req.body;
    const doctorId = req.user.id;

    const report = await labService.reviewLabReport(id, reviewNotes, doctorId);

    res.status(200).json({
      success: true,
      message: 'Lab report review logged successfully',
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export const getLabReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    // can find by report ID or labRequestId
    const report = await LabReport.findOne({
      $or: [{ _id: id }, { labRequestId: id }]
    })
      .populate('patientId')
      .populate('uploadedBy', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName');

    if (!report) {
      throw new NotFoundError('Lab report not found');
    }

    res.status(200).json({
      success: true,
      message: 'Lab report details retrieved',
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createLabRequest,
  listLabRequests,
  updateLabRequestStatus,
  uploadReport,
  reviewReport,
  getLabReport
};
