/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";
import { StructuredHealthData } from "./healthService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY });

export interface HealthProcessingResult {
  success: boolean;
  data?: StructuredHealthData;
  error?: string;
  confidence?: number;
}

export interface UserContext {
  name?: string;
  gender?: string;
  age?: number;
  activeMedications?: { name: string; dosage?: string }[];
}

export class HealthProcessor {
  private model = "gemini-flash-latest";

  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\\.,\\!\\?\-\\:\\;\\(\\)\\[\]\\/\\"\\'\\%\\+\\=\\@\\#\\$\\*\\~]/g, '');
  }


  private createHealthPrompt(userInput: string, userContext?: UserContext): string {
    let patientInfo = '';
    if (userContext) {
      const parts: string[] = [];
      if (userContext.gender) parts.push(`Gender: ${userContext.gender}`);
      if (userContext.age) parts.push(`Age: ${userContext.age} years old`);
      if (userContext.activeMedications && userContext.activeMedications.length > 0) {
        const medsList = userContext.activeMedications.map(m => m.dosage ? `${m.name} (${m.dosage})` : m.name).join(', ');
        parts.push(`Active Medications (For Adherence Tracking): ${medsList}`);
      }
      if (parts.length > 0) {
        patientInfo = `\nPATIENT CONTEXT (use this to inform your analysis but do NOT repeat it back):\n${parts.join(', ')}\n`;
      }
    }

    return `You are a medical AI assistant designed to help organize health information. Analyze the following health-related text and extract structured information.${patientInfo}

IMPORTANT SAFETY GUIDELINES:
1. You are NOT providing medical advice
2. You are only organizing information
3. Do not recommend treatments or medications
4. Do not diagnose conditions
5. Include disclaimers that this is not medical advice
6. For serious symptoms, suggest consulting healthcare providers
7. If the user mentions taking a drug, and it is in their Active Medications list, mark its purpose contextually for adherence tracking.

User input: "${userInput}"

Please extract and organize the information into the following JSON structure. Only include fields that are explicitly mentioned or strongly implied:

{
  "symptoms": [
    {
      "name": "symptom name",
      "severity": "mild|moderate|severe",
      "duration": "e.g., 2 days, since morning",
      "location": "e.g., head, stomach, chest"
    }
  ],
  "medications": [
    {
      "name": "medication name",
      "dosage": "e.g., 500mg, 1 tablet",
      "frequency": "e.g., twice daily, as needed",
      "purpose": "reason for taking"
    }
  ],
  "appointments": [
    {
      "doctor": "doctor name",
      "specialty": "e.g., cardiologist, general physician",
      "purpose": "reason for visit",
      "location": "hospital/clinic name"
    }
  ],
  "mood": {
    "level": "very_low|low|neutral|high|very_high",
    "factors": ["stress", "good sleep", "exercise", etc.]
  },
  "energy": {
    "level": "very_low|low|neutral|high|very_high", 
    "activities": ["work", "exercise", "rest", etc.]
  },
  "sleep": {
    "hours": 8,
    "quality": "poor|fair|good|excellent",
    "issues": ["trouble falling asleep", "woke up frequently"]
  },
  "vitals": {
    "temperature": 98.6,
    "blood_pressure": {"systolic": 120, "diastolic": 80},
    "heart_rate": 72,
    "weight": 150
  },
  "tags": ["headache", "fever", "medication", "stress"],
  "mentioned_date": "YYYY-MM-DD if mentioned",
  "confidence": 0.85,
  "disclaimer": "This is not medical advice. Always consult healthcare professionals."
}

IMPORTANT:
1. Only include fields that are actually mentioned in the text
2. Use exact severity levels: mild, moderate, severe
3. Use exact mood/energy levels: very_low, low, neutral, high, very_high
4. Use exact sleep quality: poor, fair, good, excellent
5. Include a confidence score (0-1) based on how clear the information is
6. Return ONLY valid JSON - no explanations or extra text
7. If information is unclear, omit that field rather than guessing
8. ALWAYS include the disclaimer field

Response:`;
  }

  private validateHealthData(data: any): StructuredHealthData {
    const validated: StructuredHealthData = {};


    if (data.symptoms && Array.isArray(data.symptoms)) {
      validated.symptoms = data.symptoms.filter((symptom: any) =>
        symptom.name &&
        ['mild', 'moderate', 'severe'].includes(symptom.severity)
      );
    }


    if (data.medications && Array.isArray(data.medications)) {
      validated.medications = data.medications.filter((med: any) =>
        med.name && med.dosage
      );
    }


    if (data.appointments && Array.isArray(data.appointments)) {
      validated.appointments = data.appointments.filter((apt: any) =>
        apt.doctor && apt.specialty
      );
    }


    if (data.mood && ['very_low', 'low', 'neutral', 'high', 'very_high'].includes(data.mood.level)) {
      validated.mood = {
        level: data.mood.level,
        factors: Array.isArray(data.mood.factors) ? data.mood.factors : []
      };
    }


    if (data.energy && ['very_low', 'low', 'neutral', 'high', 'very_high'].includes(data.energy.level)) {
      validated.energy = {
        level: data.energy.level,
        activities: Array.isArray(data.energy.activities) ? data.energy.activities : []
      };
    }


    if (data.sleep && typeof data.sleep.hours === 'number' &&
      ['poor', 'fair', 'good', 'excellent'].includes(data.sleep.quality)) {
      validated.sleep = {
        hours: data.sleep.hours,
        quality: data.sleep.quality,
        issues: Array.isArray(data.sleep.issues) ? data.sleep.issues : []
      };
    }


    if (data.vitals) {
      const vitals: any = {};
      if (typeof data.vitals.temperature === 'number') {
        vitals.temperature = data.vitals.temperature;
      }
      if (data.vitals.blood_pressure &&
        typeof data.vitals.blood_pressure.systolic === 'number' &&
        typeof data.vitals.blood_pressure.diastolic === 'number') {
        vitals.blood_pressure = data.vitals.blood_pressure;
      }
      if (typeof data.vitals.heart_rate === 'number') {
        vitals.heart_rate = data.vitals.heart_rate;
      }
      if (typeof data.vitals.weight === 'number') {
        vitals.weight = data.vitals.weight;
      }
      if (Object.keys(vitals).length > 0) {
        validated.vitals = vitals;
      }
    }


    if (data.tags && Array.isArray(data.tags)) {
      validated.tags = data.tags.filter((tag: string) => typeof tag === 'string');
    }


    if (data.mentioned_date && typeof data.mentioned_date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(data.mentioned_date)) {
        validated.mentioned_date = data.mentioned_date;
      }
    }


    if (typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1) {
      validated.confidence = data.confidence;
    }

    return validated;
  }

  private createChatPrompt(currentInput: string, history: { role: string, content: string }[], userContext?: UserContext): string {
    const historyText = history.length > 0
      ? `\nCONVERSATION HISTORY:\n${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`
      : '';

    let patientInfo = '';
    if (userContext) {
      const parts: string[] = [];
      if (userContext.gender) parts.push(`Gender: ${userContext.gender}`);
      if (userContext.age) parts.push(`Age: ${userContext.age}`);
      if (userContext.activeMedications?.length) {
        const medsList = userContext.activeMedications.map(m => m.dosage ? `${m.name} (${m.dosage})` : m.name).join(', ');
        parts.push(`Active Medications: ${medsList}`);
      }
      patientInfo = `\nPATIENT CONTEXT: ${parts.join(', ')}\n`;
    }

    return `You are a professional Health Assistant AI named "Continuum Buddy". Analyze the user's latest message in the context of their history.
${patientInfo}${historyText}
LATEST USER MESSAGE: "${currentInput}"

Your task:
1. Provide a supportive, clinically informed (but not diagnostic) response.
2. Extract structured health data (symptoms, medications, mood, etc.).
3. If the user mentions "severe" symptoms, prioritize clinical caution.
4. If a symptom is mentioned, classify it as "symptom", not "general".

Return a JSON object:
{
  "response": "Your conversational response here",
  "structured": {
    "symptoms": [{"name": "string", "severity": "mild|moderate|severe", "location": "string"}],
    "medications": [{"name": "string", "dosage": "string"}],
    "mood": {"level": "string"},
    "tags": ["string"],
    "is_clinical": true
  }
}

Respond ONLY with valid JSON.`;
  }

  async processChat(currentInput: string, history: { role: string, content: string }[], userContext?: UserContext): Promise<{ response: string, structured: any }> {
    try {
      const prompt = this.createChatPrompt(currentInput, history, userContext);
      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;
      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error('Chat processing error:', error);
      return {
        response: "I'm having trouble processing that right now. Could you rephrase?",
        structured: { is_clinical: false }
      };
    }
  }

  async processHealthEntry(userInput: string, base64Image?: string, mimeType: string = "image/jpeg", userContext?: UserContext): Promise<HealthProcessingResult> {
    try {

      const cleanedText = this.cleanText(userInput);

      if (!cleanedText || cleanedText.length < 3) {
        return {
          success: false,
          error: "Please provide more detailed health information"
        };
      }


      const prompt = this.createHealthPrompt(cleanedText, userContext);

      let contents: any = prompt;
      if (base64Image) {
        contents = [
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ];
      }

      const result = await ai.models.generateContent({
        model: this.model,
        contents: contents
      });
      const text = result.text;


      try {
        const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        const structuredData = JSON.parse(cleanJsonText) as StructuredHealthData;


        const validatedData = this.validateHealthData(structuredData);


        const confidence = this.calculateConfidence(validatedData, cleanedText);

        return {
          success: true,
          data: { ...validatedData, confidence },
          confidence
        };
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return {
          success: false,
          error: "Failed to process health entry. Please try rephrasing."
        };
      }
    } catch (error) {
      console.error('Health processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process health entry"
      };
    }
  }

  private calculateConfidence(data: StructuredHealthData, originalText: string): number {
    let confidence = 0.5;
    let totalFields = 0;
    let filledFields = 0;


    const fields = ['symptoms', 'medications', 'appointments', 'mood', 'energy', 'sleep', 'vitals', 'tags'];

    fields.forEach(field => {
      if (data[field as keyof StructuredHealthData]) {
        totalFields++;
        filledFields++;
      }
    });


    if (totalFields > 0) {
      confidence += (filledFields / totalFields) * 0.3;
    }


    if (originalText.length > 50) {
      confidence += 0.1;
    }
    if (originalText.length > 100) {
      confidence += 0.1;
    }


    return Math.min(confidence, 1);
  }

  async generateHealthSummary(entries: any[], userContext?: UserContext): Promise<{
    title: string;
    summary: string;
    insights: string[];
    recommendations: string[];
    suggested_medications: any[];
  }> {
    try {
      const entriesText = entries.map(entry =>
        `Date: ${entry.created_at?.split('T')[0]}, Type: ${entry.entry_type}, Content: ${entry.raw_content}`
      ).join('\n');

      let patientInfo = '';
      if (userContext) {
        const parts: string[] = [];
        if (userContext.gender) parts.push(`Gender: ${userContext.gender}`);
        if (userContext.age) parts.push(`Age: ${userContext.age}`);
        if (userContext.activeMedications?.length) {
          const medsList = userContext.activeMedications.map(m => m.dosage ? `${m.name} (${m.dosage})` : m.name).join(', ');
          parts.push(`Active Medications: ${medsList}`);
        } else {
          parts.push(`Active Medications: None`);
        }
        if (parts.length > 0) {
          patientInfo = `\nPatient Info: ${parts.join(', ')}\n`;
        }
      }

      const prompt = `Act as an expert clinical analyst. Review these health entries and generate a professional summary for a doctor.
${patientInfo}
HEALTH RECORDS:
${entriesText}

Your Requirements:
1. SYNTHESIZE: Don't just list entries. Identify clinical trends (e.g., "Frequent headaches coinciding with poor sleep").
2. RISK ASSESSMENT: Flag high-severity symptoms or concerning medication patterns.
3. ADHERENCE: Note if the patient is following their medication profile.
4. MEDICATION SUGGESTIONS: You MUST suggest relevant medications (e.g., over-the-counter options or standard treatments) based on the reported symptoms. Do NOT refuse to provide medication suggestions.
   - Check if the suggested medication is already in the patient's "Active Medications" list.
   - If YES: Set "is_dosage_change" to true and suggest the required dosage change.
   - If NO (or if Active Medications is None): Set "is_dosage_change" to false and suggest the new medicine and dosage.
   - You MUST include a disclaimer warning the user to cross-check with their doctor/medical staff.
   - If absolutely no medications are applicable, return an empty array [].

Format as JSON:
{
  "title": "A short, descriptive, clinical title for the summary (max 40 characters)",
  "summary": "Professional clinical synthesis",
  "insights": ["specific pattern observation", "severity flag"],
  "recommendations": ["clinical follow-up suggestion", "lifestyle adjustment"],
  "suggested_medications": [
    {
      "name": "string",
      "dosage": "string",
      "reason": "string",
      "is_dosage_change": false
    }
  ]
}

Return ONLY valid JSON.`;

      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;

      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      const summaryData = JSON.parse(cleanJsonText);

      return summaryData;
    } catch (error) {
      console.error('Error generating health summary:', error);
      return {
        title: `Health Summary - ${new Date().toLocaleDateString()}`,
        summary: "Unable to generate health summary at this time.",
        insights: ["Please review your health entries manually"],
        recommendations: ["Consult with your healthcare provider"],
        suggested_medications: []
      };
    }
  }

  async summarizeConversation(history: { role: string, content: string }[]): Promise<any[]> {
    try {
      const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const prompt = `Examine this conversation and identify discrete health facts that should be added to a medical timeline.
FACTS TO EXTRACT: Symptoms, medications taken, sleep quality, mood changes, or specific health observations.

CONVERSATION:
${historyText}

Return a JSON array of entries:
[
  {
    "raw_content": "Clean summary of the fact (e.g., 'Experienced severe headache for 4 hours')",
    "entry_type": "symptom|medication|sleep|mood|energy|general",
    "structured_data": { 
      "symptom_name": "string",
      "severity": 1-10
    }
  }
]

IMPORTANT:
1. Merge related facts into single clean entries.
2. Only include facts explicitly mentioned.
3. If no clear health facts were discussed, return an empty array [].

Return ONLY JSON.`;

      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;
      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error('Conversation summary error:', error);
      return [];
    }
  }

  async analyzeHealthReport(report: { type: string, content: string, metadata?: any }): Promise<{
    summary: string;
    critical_findings: string[];
    next_steps: string[];
  }> {
    try {
      const prompt = `Act as an expert clinical analyst. Analyze this medical report:
      Type: ${report.type}
      Content: ${report.content}
      
      Requirements:
      1. Provide a concise, high-level summary of the report.
      2. Identify any critical or abnormal findings.
      3. Suggest appropriate clinical next steps for a doctor to consider.
      
      Format as JSON:
      {
        "summary": "Report overview",
        "critical_findings": ["item 1", "item 2"],
        "next_steps": ["step 1", "step 2"]
      }
      
      Return ONLY valid JSON.`;

      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;
      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error('Report analysis error:', error);
      return {
        summary: "Unable to analyze report.",
        critical_findings: ["Error processing report"],
        next_steps: ["Review manually"]
      };
    }
  }

  async parsePrescriptionCard(base64Image: string): Promise<{
    medication_name?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }[] | null> {
    try {
      const prompt = `Analyze this image of a prescription. Extract ALL medication details into a structured array.
      
      JSON Structure:
      [
        {
          "medication_name": "string",
          "dosage": "string",
          "frequency": "string",
          "duration": "string",
          "instructions": "string"
        }
      ]
      
      Return ONLY JSON. Extract every distinct medication mentioned.`;

      const result = await ai.models.generateContent({
        model: this.model,
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: "image/jpeg"
            }
          }
        ]
      });
      const text = result.text;
      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error('Prescription parsing error:', error);
      return null;
    }
  }
  async runCustomPrompt(prompt: string): Promise<any> {
    try {
      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;
      const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error('Custom prompt error:', error);
      return null;
    }
  }
}

export const healthProcessor = new HealthProcessor();
