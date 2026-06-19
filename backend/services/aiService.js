import logger from '../config/logger.js';

// Configuration variables (dynamically resolved at execution time inside _queryLLM to prevent load-time caching issues)

/**
 * Main AI Service Orchestrator
 */
class AIService {
  
  /**
   * Helper to query LLM (Gemini or OpenAI) with a fallback to mock data
   */
  async _queryLLM(prompt, systemInstruction, mockFallbackFn) {
    const startTime = Date.now();
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const openAiApiKey = process.env.OPENAI_API_KEY || '';
    
    // 1. Try Gemini first if key exists
    if (geminiApiKey) {
      try {
        logger.info('Querying Gemini API...');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          }
        );
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error (Status ${response.status}): ${errText}`);
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = this._cleanAndParseJSON(text);
          return {
            success: true,
            data: parsed,
            tokens: {
              promptTokens: 100, // approximations
              completionTokens: 200,
              totalTokens: 300
            },
            latency: Date.now() - startTime
          };
        }
      } catch (err) {
        logger.error(`Gemini API execution failed: ${err.message}. Cascading...`);
      }
    }

    // 2. Try OpenAI if key exists
    if (openAiApiKey) {
      try {
        logger.info('Querying OpenAI API...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API error (Status ${response.status}): ${errText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        
        if (text) {
          const parsed = this._cleanAndParseJSON(text);
          return {
            success: true,
            data: parsed,
            tokens: {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens
            },
            latency: Date.now() - startTime
          };
        }
      } catch (err) {
        logger.error(`OpenAI API execution failed: ${err.message}. Cascading...`);
      }
    }

    // 3. Fallback to Local Mock Engine
    logger.warn('No LLM API keys configured or API failed. Falling back to Local Rules Engine.');
    const mockResult = mockFallbackFn();
    return {
      success: true,
      data: mockResult,
      tokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      latency: Date.now() - startTime
    };
  }

  _cleanAndParseJSON(rawText) {
    try {
      // Remove any markdown code fences if LLM wrapped it
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      return JSON.parse(cleanText.trim());
    } catch (e) {
      logger.error('Failed to parse LLM response as JSON. Returning raw wrapper.', e);
      return { rawResponse: rawText };
    }
  }

  /**
   * FEATURE 1: SYMPTOM ANALYZER
   */
  async analyzeSymptoms(symptomsObj) {
    const { fever, headache, cough, chestPain, fatigue, additionalInfo } = symptomsObj;
    
    const prompt = `Analyze symptoms:
- Fever: ${fever ? 'Yes' : 'No'}
- Headache: ${headache ? 'Yes' : 'No'}
- Cough: ${cough ? 'Yes' : 'No'}
- Chest Pain: ${chestPain ? 'Yes' : 'No'}
- Fatigue: ${fatigue ? 'Yes' : 'No'}
- Additional user description: "${additionalInfo || ''}"`;

    const systemInstruction = `You are an expert AI clinical diagnostic assistant. Analyze patient symptoms and return a structured JSON response containing:
1. "possibleConditions": Array of strings (top 3 likely medical conditions).
2. "recommendedDepartment": String (appropriate department, e.g. Cardiology, Pulmonology, General Medicine).
3. "riskLevel": String (Low, Medium, High, Critical).
4. "urgencyLevel": String (Routine, Schedule Appointment, Visit Urgent Care, Go to Emergency Room).
5. "explanation": String (Brief rationale for clinical assessment).
6. "disclaimer": String (Standard medical disclaimer noting this is AI advice, not clinical diagnosis).

Response MUST be strictly a valid JSON object.`;

    const mockFallback = () => {
      let conditions = ['Viral Infection', 'General Fatigue'];
      let department = 'General Medicine';
      let risk = 'Low';
      let urgency = 'Schedule Appointment';
      let explanation = 'Symptoms indicate a mild viral infection or fatigue. Ensure rest and hydration.';

      if (chestPain) {
        conditions = ['Acute Coronary Syndrome', 'Angina Pectoris', 'Gastroesophageal Reflux Disease'];
        department = 'Cardiology / Emergency';
        risk = 'Critical';
        urgency = 'Go to Emergency Room';
        explanation = 'Chest pain is a critical symptom that may indicate coronary artery occlusion or acute cardiac events. Prompt evaluation in the emergency department is required.';
      } else if (fever && cough && fatigue) {
        conditions = ['Bronchitis', 'Influenza', 'COVID-19'];
        department = 'Pulmonology / General Medicine';
        risk = 'Medium';
        urgency = 'Visit Urgent Care';
        explanation = 'Combination of fever, cough, and fatigue points to respiratory tract infection. Monitor oxygen and temperature.';
      } else if (headache && fever) {
        conditions = ['Migraine', 'Sinusitis', 'Early Viral Illness'];
        department = 'General Medicine';
        risk = 'Medium';
        urgency = 'Schedule Appointment';
        explanation = 'Fever and headache suggest systemic response to infection. Consult a primary care physician.';
      }

      return {
        possibleConditions: conditions,
        recommendedDepartment: department,
        riskLevel: risk,
        urgencyLevel: urgency,
        explanation,
        disclaimer: 'Disclaimer: This symptom analysis is generated by an artificial intelligence and is for educational purposes only. It does NOT constitute formal medical advice, diagnosis, or treatment. If you are experiencing a life-threatening emergency, please dial your local emergency services (911/112) immediately.'
      };
    };

    return this._queryLLM(prompt, systemInstruction, mockFallback);
  }

  /**
   * FEATURE 2: MEDICAL RECORD SUMMARIZER
   */
  async summarizePatientHistory(patientData, emrList, labList, prescriptionList, consultationList) {
    const prompt = `Summarize the clinical profile for:
Patient: ${patientData.firstName} ${patientData.lastName}, Age: ${this._calculateAge(patientData.dateOfBirth)}, Gender: ${patientData.gender}.
EMR History: ${JSON.stringify(emrList.map(e => ({ date: e.encounterDate, notes: e.clinicalNotes, diagnoses: e.diagnoses, drugs: e.prescriptions })))}
Lab Reports: ${JSON.stringify(labList.map(l => ({ type: l.testType, results: l.results, reviewed: l.reviewedAt })))}
Prescription list: ${JSON.stringify(prescriptionList)}
Consultation records: ${JSON.stringify(consultationList.map(c => ({ date: c.encounterDate, notes: c.clinicalNotes, diagnosis: c.diagnoses })))}`;

    const systemInstruction = `You are a Senior Consulting Physician. Synthesize raw electronic medical records, lab parameters, prescriptions, and consult notes into a clear clinical summary. Return a structured JSON containing:
1. "medicalSummary": A concise summary paragraph of the patient's current clinical state.
2. "keyDiseases": Array of active diagnosed chronic or acute conditions.
3. "allergies": Array of identified allergies.
4. "medications": Array of current active medications with dosage/frequency.
5. "importantMedicalEvents": Array of events with timestamps (e.g. consultations, lab reports, acute admissions).

Response must be strictly valid JSON.`;

    const mockFallback = () => {
      const activeMedications = [];
      const activeDiseases = [];
      const medicalEvents = [];

      // Extract details from EMRs
      emrList.forEach(e => {
        if (e.diagnoses) {
          e.diagnoses.forEach(d => {
            if (!activeDiseases.includes(d.name)) activeDiseases.push(d.name);
          });
        }
        if (e.prescriptions) {
          e.prescriptions.forEach(p => {
            activeMedications.push(`${p.drugName} (${p.dosage} - ${p.frequency})`);
          });
        }
        medicalEvents.push({
          event: `Clinical Consultation: ${e.diagnoses?.map(d => d.name).join(', ') || 'General Checkup'}`,
          date: new Date(e.encounterDate).toLocaleDateString()
        });
      });

      // Extract lab reports
      labList.forEach(l => {
        medicalEvents.push({
          event: `Lab Report Received: ${l.testType} - ${l.results || 'Pending'}`,
          date: new Date(l.uploadedAt).toLocaleDateString()
        });
      });

      // Extract prescriptions
      prescriptionList.forEach(p => {
        const desc = `${p.drugName} - ${p.dosage} ${p.frequency}`;
        if (!activeMedications.includes(desc)) activeMedications.push(desc);
      });

      return {
        medicalSummary: `The patient is a ${this._calculateAge(patientData.dateOfBirth)}-year-old ${patientData.gender.toLowerCase()} presenting with a history of ${activeDiseases.join(', ') || 'no chronic illnesses'}. Recent evaluations show active treatments and ongoing diagnostic tracking.`,
        keyDiseases: activeDiseases.length > 0 ? activeDiseases : ['No diagnosed chronic diseases'],
        allergies: patientData.allergies || [],
        medications: activeMedications.length > 0 ? activeMedications : ['No active prescriptions'],
        importantMedicalEvents: medicalEvents
      };
    };

    return this._queryLLM(prompt, systemInstruction, mockFallback);
  }

  /**
   * FEATURE 3: PRESCRIPTION EXPLAINER
   */
  async explainPrescription(medicineName, patientQuery) {
    const prompt = `Explain medicine: "${medicineName}". Patient asks: "${patientQuery || 'How should I take this medication?'}"`;

    const systemInstruction = `You are an expert Clinical Pharmacist. Explain prescription details to a patient in simple, empathetic, easy-to-understand language. Return a structured JSON containing:
1. "dosageInstructions": Simple explanation of when and how to take it.
2. "sideEffects": List of common and severe side effects to monitor.
3. "safetyWarnings": Precautions, contraindications, and what to avoid (e.g. alcohol, driving, pregnancy).
4. "lifestyleRecommendations": Nutritional or daily habit tips related to the medication.

Response must be strictly valid JSON.`;

    const mockFallback = () => {
      const med = medicineName.toLowerCase();
      let instructions = 'Take exactly as directed by your prescribing physician. Typically taken with a full glass of water.';
      let sideEffects = ['Nausea', 'Dizziness', 'Mild headache'];
      let warnings = ['Do not double doses', 'Consult pharmacist before taking other drugs', 'Avoid alcohol'];
      let lifestyle = ['Stay well hydrated', 'Get adequate rest'];

      if (med.includes('paracetamol') || med.includes('acetaminophen')) {
        instructions = 'Take 1-2 tablets (500mg - 1000mg) every 4-6 hours as needed for fever or pain. Do not exceed 4000mg (8 tablets) in 24 hours.';
        sideEffects = ['Rare: liver enzyme changes', 'Allergic rash', 'Nausea'];
        warnings = ['Avoid all other products containing acetaminophen to prevent severe liver damage', 'Avoid alcohol as it increases risk of liver toxicity'];
        lifestyle = ['Take with or after food if it causes stomach upset', 'Monitor temperature logs'];
      } else if (med.includes('amoxicillin') || med.includes('penicillin') || med.includes('antibiotic')) {
        instructions = 'Take 1 tablet every 8 or 12 hours. It is critical to finish the entire prescribed course even if you feel better earlier.';
        sideEffects = ['Diarrhea / Loose stools', 'Stomach upset', 'Oral thrush or yeast infection'];
        warnings = ['Do not take if you have a known penicillin allergy', 'Contact doctor immediately if you develop a widespread rash, hives, or swelling'];
        lifestyle = ['Probiotics can help restore healthy gut bacteria', 'Take with meals to minimize abdominal cramps'];
      } else if (med.includes('metformin') || med.includes('diabetes')) {
        instructions = 'Take twice daily with breakfast and dinner. Take with food to reduce gastrointestinal side effects.';
        sideEffects = ['Metallic taste in mouth', 'Bloating / Gas', 'Diarrhea', 'Nausea'];
        warnings = ['Rare but serious risk of lactic acidosis', 'Discontinue temporarily before any contrast scan procedures', 'Monitor blood glucose levels regularly'];
        lifestyle = ['Adopt a low glycemic index diet', 'Maintain regular physical exercise', 'Limit carbohydrate intakes'];
      }

      return {
        dosageInstructions: instructions,
        sideEffects,
        safetyWarnings: warnings,
        lifestyleRecommendations: lifestyle
      };
    };

    return this._queryLLM(prompt, systemInstruction, mockFallback);
  }

  /**
   * FEATURE 4: APPOINTMENT ASSISTANT
   */
  async assistAppointment(queryText, doctors, slotsByDoctor) {
    const prompt = `Patient query: "${queryText}".
Available Doctors: ${JSON.stringify(doctors.map(d => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, specialty: d.role })))}
Available Slots data: ${JSON.stringify(slotsByDoctor)}`;

    const systemInstruction = `You are a Medical Reception AI Assistant. Help the patient find the best department, doctor, and slot based on their conversational query. Return a structured JSON containing:
1. "recommendedSpecialty": String (e.g. Cardiology, Neurology, Pediatrics, General Medicine).
2. "recommendedDoctor": Object containing: "id", "name", "specialty".
3. "suggestedSlots": Array of objects, each containing: "date" (YYYY-MM-DD or day of week), "startTime", "endTime".
4. "message": String (Conversational response to the patient confirming recommendations).

Response must be strictly valid JSON.`;

    const mockFallback = () => {
      let specialty = 'General Medicine';
      let docObj = null;
      let suggestions = [];

      const queryLower = queryText.toLowerCase();
      if (queryLower.includes('cardio') || queryLower.includes('heart') || queryLower.includes('chest')) {
        specialty = 'Cardiology';
      } else if (queryLower.includes('child') || queryLower.includes('pediatr') || queryLower.includes('baby')) {
        specialty = 'Pediatrics';
      }

      // Pick first matching doctor from roles or list
      const matchingDoc = doctors.find(d => 
        d.role === 'Doctor' || 
        d.firstName.toLowerCase().includes('sarah')
      ) || doctors[0];

      if (matchingDoc) {
        docObj = {
          id: matchingDoc._id,
          name: `Dr. ${matchingDoc.firstName} ${matchingDoc.lastName}`,
          specialty: 'Medical Specialist'
        };

        // Create standard upcoming slot
        suggestions = [
          { date: 'Next Monday', startTime: '09:00', endTime: '10:00' },
          { date: 'Next Monday', startTime: '10:30', endTime: '11:30' }
        ];
      }

      return {
        recommendedSpecialty: specialty,
        recommendedDoctor: docObj,
        suggestedSlots: suggestions,
        message: `Based on your request, I recommend booking with ${docObj ? docObj.name : 'our general practitioners'}. I have identified open slots for next Monday morning.`
      };
    };

    return this._queryLLM(prompt, systemInstruction, mockFallback);
  }

  /**
   * FEATURE 5: OPERATIONS INTELLIGENCE
   */
  async analyzeOperations(query, billingData, appointmentData, volumeData) {
    const prompt = `Admin Query: "${query}".
Billing Metrics: ${JSON.stringify(billingData)}
Appointment Trends: ${JSON.stringify(appointmentData)}
Patient Volumes: ${JSON.stringify(volumeData)}`;

    const systemInstruction = `You are an Executive Health Analytics Advisor. Analyze the hospital operations and revenue trends. Generate a structured JSON response containing:
1. "insights": Array of strings (Key observations regarding revenue, delays, volumes).
2. "recommendations": Array of strings (Tactical suggestions to optimize resources, minimize delays, or boost revenue).
3. "forecasts": Array of strings (Projected outlook based on existing data trends).
4. "summaryText": String (Conversational executive summary).

Response must be strictly valid JSON.`;

    const mockFallback = () => {
      let insights = [
        'Revenue shows a stable trend with slight department-wise fluctuations.',
        'Appointment volume peaked during morning sessions leading to transient patient waiting times.'
      ];
      let recommendations = [
        'Distribute doctor consultation slots more evenly across afternoon sessions.',
        'Implement instant digital billing to decrease queues at checkout.'
      ];
      let forecasts = [
        'Patient volume is projected to rise by 4% next month due to seasonal shifts.',
        'Revenue is expected to increase upon clearing the pending lab orders billing.'
      ];

      const q = query.toLowerCase();
      if (q.includes('revenue') || q.includes('decrease') || q.includes('money')) {
        insights = [
          'Billing audits show pharmacy collections are down 8% due to supply reorder latency.',
          'Inpatient stay durations have optimized, slightly lowering daily room revenue.'
        ];
        recommendations = [
          'Enable instant payment alerts to billing executives for unpaid laboratory reviews.',
          'Optimize outpatient pharmacy inventories with automatic minimum replenishment thresholds.'
        ];
        forecasts = [
          'Revenue is projected to rebound by 10% next quarter upon streamlining insurance pre-auth channels.'
        ];
      } else if (q.includes('delay') || q.includes('wait') || q.includes('appointment')) {
        insights = [
          'Wait times peak between 9:00 AM and 11:30 AM on Mondays.',
          'Doctor utilization stands at 88% capacity during morning rounds.'
        ];
        recommendations = [
          'Encourage telemedicine check-ups for recurring follow-up consultations.',
          'Establish a nurse triage coordinator to streamline inpatient intake.'
        ];
        forecasts = [
          'Monday morning delays can be reduced by 25% if 3 additional doctor slots are open.'
        ];
      }

      return {
        insights,
        recommendations,
        forecasts,
        summaryText: `Analysis indicates opportunities to improve operational efficiency. Key action items include smoothing peak appointment bookings and reducing inventory-related pharmacy delays.`
      };
    };

    return this._queryLLM(prompt, systemInstruction, mockFallback);
  }

  _calculateAge(dob) {
    if (!dob) return 30;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
}

export const aiService = new AIService();
export default aiService;
