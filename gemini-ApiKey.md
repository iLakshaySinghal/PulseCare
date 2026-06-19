# Enabling Gemini AI Bot Features

This guide explains how to get a Gemini API key and configure it in the Hospital Management System (HMS) to activate advanced AI features.

---

## 1. How to Get a Gemini API Key

You can get a Gemini API key for free (within rate limits) from Google AI Studio:

1. **Go to Google AI Studio:**
   Navigate to [Google AI Studio (https://aistudio.google.com/)](https://aistudio.google.com/).
2. **Sign In:**
   Log in with your Google account.
3. **Generate an API Key:**
   - Click on the **"Get API key"** button (usually in the top left sidebar).
   - Click **"Create API key"**.
   - Select a Google Cloud project (or create a new one automatically).
   - Copy the generated API key.

---

## 2. Configure the API Key in the project

To activate the Gemini LLM engine, add your API key to the environment variables configuration.

### Step-by-step setup:

1. Open the **`backend/.env`** file.
2. Add the following line at the end of the file:
   ```env
   # Google Gemini API configuration
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Replace `your_actual_gemini_api_key_here` with the API key you copied from Google AI Studio.
4. Save the file.
5. Restart the backend development server (`npm run dev`) to load the new environment variable.

---

## 3. Supported AI Bot Features

Once the `GEMINI_API_KEY` is loaded, the backend service automatically redirects all AI-powered routes from mock generators to the real **Gemini 1.5 Flash** model:

* **Symptom Analyzer:** Analyzes multi-triage patient symptoms and advises on the risk level, urgency, recommended hospital department, and disclaimer notes.
* **Medical Record Summarizer:** Synthesizes raw electronic medical records (EMR), laboratory reports, consultations, and prescriptions into a unified senior physician clinical summary.
* **Prescription Explainer:** Translates medicine properties and dosages into patient-friendly, empathetic lifestyle guides and side-effect sheets.
* **Appointment Assistant:** Natural language booking assistant that maps user requests to doctors and matching time-slot availabilities.
* **Operations Intelligence:** Health executive analytics assistant forecasting revenue trends, consultation delays, and patient volumes.

---

## 4. Verification Check

To verify the integration:
- Look at the backend console logs when query actions are made in the AI Assistant features.
- If correctly configured, you will see the log: `Querying Gemini API...`
- If the key is missing, the server will log a warning and fall back to local rules/mock engines: `No LLM API keys configured or API failed. Falling back to Local Rules Engine.`
