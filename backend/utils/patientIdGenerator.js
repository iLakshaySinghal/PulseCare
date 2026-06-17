import Patient from '../models/Patient.js';

/**
 * Generates a unique patient ID with format: PT-YYYYMMDD-XXXX
 * Where XXXX is a random 4-digit string. Checks database to guarantee uniqueness.
 */
export const generatePatientId = async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  let isUnique = false;
  let patientId = '';
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    attempts++;
    const randomNum = String(Math.floor(1000 + Math.random() * 9000));
    patientId = `PT-${dateStr}-${randomNum}`;
    
    const count = await Patient.countDocuments({ patientId });
    if (count === 0) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error('Could not generate a unique Patient ID after multiple attempts.');
  }

  return patientId;
};

export default generatePatientId;
