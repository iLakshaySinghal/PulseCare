import { jest, describe, test, expect } from '@jest/globals';
import aiService from '../../services/aiService.js';

describe('Unit Test: AI Healthcare Service Orchestrator', () => {
  test('analyzeSymptoms - should correctly trigger rules engine on chest pain', async () => {
    const symptoms = {
      chestPain: true,
      fever: false,
      headache: false,
      cough: false,
      fatigue: false,
      additionalInfo: ''
    };

    const result = await aiService.analyzeSymptoms(symptoms);
    
    expect(result.success).toBe(true);
    expect(result.data.riskLevel).toBe('Critical');
    expect(result.data.urgencyLevel).toBe('Go to Emergency Room');
    expect(result.data.recommendedDepartment).toContain('Cardiology');
  });

  test('explainPrescription - should explain Paracetamol properly', async () => {
    const medName = 'Paracetamol 500mg';
    const query = 'How many times can I take this in a day?';

    const result = await aiService.explainPrescription(medName, query);

    expect(result.success).toBe(true);
    expect(result.data.dosageInstructions).toContain('4-6 hours');
    expect(result.data.safetyWarnings.some(w => w.includes('liver damage'))).toBe(true);
  });

  test('summarizePatientHistory - should compile EMR and lab records successfully', async () => {
    const patient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1985-04-20'),
      gender: 'Male',
      allergies: ['Peanuts']
    };

    const emrs = [
      {
        encounterDate: new Date('2026-05-10'),
        clinicalNotes: 'Follow-up on hypertension',
        diagnoses: [{ name: 'Hypertension' }]
      }
    ];

    const labs = [];
    const prescriptions = [];
    const consultations = [];

    const result = await aiService.summarizePatientHistory(
      patient,
      emrs,
      labs,
      prescriptions,
      consultations
    );

    expect(result.success).toBe(true);
    expect(result.data.keyDiseases).toContain('Hypertension');
    expect(result.data.allergies).toContain('Peanuts');
  });
});
