import Joi from 'joi';

export const createMedicineSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  genericName: Joi.string().trim().max(100).required(),
  form: Joi.string().valid('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other').required(),
  strength: Joi.string().trim().required(),
  manufacturer: Joi.string().trim().allow('', null).optional(),
  description: Joi.string().trim().allow('', null).optional()
});

export const addStockSchema = Joi.object({
  medicineId: Joi.string().hex().length(24).required(),
  stock: Joi.number().integer().min(1).required(),
  expiryDate: Joi.date().greater('now').required(),
  supplier: Joi.string().trim().allow('', null).optional(),
  batchNumber: Joi.string().trim().required(),
  unitPrice: Joi.number().min(0).required(),
  reorderLevel: Joi.number().integer().min(0).optional()
});

export const dispenseSchema = Joi.object({
  emrId: Joi.string().hex().length(24).required(),
  dispensedMedicines: Joi.array().items(Joi.object({
    medicineId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).required(),
    batchNumber: Joi.string().required()
  })).min(1).required()
});

export default {
  createMedicineSchema,
  addStockSchema,
  dispenseSchema
};
