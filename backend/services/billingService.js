import Consultation from '../models/Consultation.js';
import LabRequest from '../models/LabRequest.js';
import DispenseRecord from '../models/DispenseRecord.js';
import Medicine from '../models/Medicine.js';
import EmergencyCase from '../models/EmergencyCase.js';
import Admission from '../models/Admission.js';
import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';

class BillingService {

  /**
   * Scan all departments for unbilled events associated with a patient
   */
  async getUnbilledItems(patientId) {
    const unbilledItems = [];

    // 1. Gather all created invoices for this patient to filter out already-billed reference IDs
    const existingInvoices = await Invoice.find({ patientId, status: { $ne: 'Cancelled' } });
    const billedRefs = new Set();
    existingInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.referenceId) billedRefs.add(item.referenceId.toString());
      });
    });

    // 2. Fetch completed Consultations
    const consultations = await Consultation.find({ patientId });
    consultations.forEach(c => {
      if (!billedRefs.has(c._id.toString())) {
        unbilledItems.push({
          source: 'Consultation',
          referenceId: c._id,
          name: `Doctor Consultation - Encounter ${new Date(c.encounterDate).toLocaleDateString()}`,
          quantity: 1,
          unitPrice: 150, // Standard Consultation fee
          totalPrice: 150
        });
      }
    });

    // 3. Fetch Lab Requests that are Ordered/Completed and not billed
    const labs = await LabRequest.find({ patientId });
    labs.forEach(l => {
      if (!billedRefs.has(l._id.toString()) && l.billingStatus === 'Pending') {
        let price = 75; // blood test
        if (l.testType === 'X-Ray') price = 120;
        if (l.testType === 'MRI') price = 600;
        if (l.testType === 'CT Scan') price = 400;

        unbilledItems.push({
          source: 'Lab',
          referenceId: l._id,
          name: `Lab Scan: ${l.testType}`,
          quantity: 1,
          unitPrice: price,
          totalPrice: price
        });
      }
    });

    // 4. Fetch Dispense Records (Pharmacy)
    const dispenses = await DispenseRecord.find({ patientId, status: 'Dispensed' }).populate('dispensedMedicines.medicineId');
    dispenses.forEach(d => {
      if (!billedRefs.has(d._id.toString())) {
        d.dispensedMedicines.forEach(item => {
          const medName = item.medicineId?.name || 'Dispensed Medicine';
          const qty = item.quantity || 1;
          const unitPrice = 12; // Flat rate per unit of medicine
          unbilledItems.push({
            source: 'Medicine',
            referenceId: d._id,
            name: `Pharmacy Dispense: ${medName}`,
            quantity: qty,
            unitPrice: unitPrice,
            totalPrice: qty * unitPrice
          });
        });
      }
    });

    // 5. Fetch Emergency Cases
    const emergencyCases = await EmergencyCase.find({ patientId });
    emergencyCases.forEach(ec => {
      if (!billedRefs.has(ec._id.toString())) {
        unbilledItems.push({
          source: 'Emergency',
          referenceId: ec._id,
          name: `ER Triage & Admission - Case ${ec.caseNumber}`,
          quantity: 1,
          unitPrice: 300, // Triage + Treatment fee
          totalPrice: 300
        });
      }
    });

    // 6. Fetch Admissions (Inpatient stay charges)
    const admissions = await Admission.find({ patientId }).populate('roomId');
    admissions.forEach(adm => {
      if (!billedRefs.has(adm._id.toString())) {
        // Calculate stay duration
        const start = new Date(adm.admissionDate);
        const end = adm.dischargeDate ? new Date(adm.dischargeDate) : new Date();
        const diffTime = Math.abs(end - start);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) diffDays = 1; // Minimum 1 day

        const dailyRate = adm.roomId?.chargesPerDay || 200; // default 200/day
        const totalRoomPrice = diffDays * dailyRate;

        unbilledItems.push({
          source: 'Admission',
          referenceId: adm._id,
          name: `Inpatient Bed Stay: ${adm.roomId?.roomNumber || 'Ward'} (${diffDays} days)`,
          quantity: diffDays,
          unitPrice: dailyRate,
          totalPrice: totalRoomPrice
        });
      }
    });

    return unbilledItems;
  }
}

export const billingService = new BillingService();
export default billingService;
