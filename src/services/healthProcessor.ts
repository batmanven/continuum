import { GoogleGenAI } from "@google/genai";
import { StructuredHealthData } from "./healthService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY });

export interface HealthProcessingResult {
  success: boolean;
  data?: StructuredHealthData;
  error?: string;
  confidence?: number;
}

export class HealthProcessor {
  private model = "gemini-flash-latest";

  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\.\,\!\?\-\:\;\(\)\[\]\/\"\'\%\+\=\@\#\$\&\*\~]/g, '');
  }

  private createHealthPrompt(userInput: string): string {
    return `You are a medical AI assistant. Analyze the following health-related text and extract structured information.

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
  "confidence": 0.85
}

IMPORTANT:
1. Only include fields that are actually mentioned in the text
2. Use exact severity levels: mild, moderate, severe
3. Use exact mood/energy levels: very_low, low, neutral, high, very_high
4. Use exact sleep quality: poor, fair, good, excellent
5. Include a confidence score (0-1) based on how clear the information is
6. Return ONLY valid JSON - no explanations or extra text
7. If information is unclear, omit that field rather than guessing

Response:`;
  }

  private validateHealthData(data: any): StructuredHealthData {
    const validated: StructuredHealthData = {};

    // Validate symptoms
    if (data.symptoms && Array.isArray(data.symptoms)) {
      validated.symptoms = data.symptoms.filter((symptom: any) => 
        symptom.name && 
        ['mild', 'moderate', 'severe'].includes(symptom.severity)
      );
    }

    // Validate medications
    if (data.medications && Array.isArray(data.medications)) {
      validated.medications = data.medications.filter((med: any) => 
        med.name && med.dosage
      );
    }

    // Validate appointments
    if (data.appointments && Array.isArray(data.appointments)) {
      validated.appointments = data.appointments.filter((apt: any) => 
        apt.doctor && apt.specialty
      );
    }

    // Validate mood
    if (data.mood && ['very_low', 'low', 'neutral', 'high', 'very_high'].includes(data.mood.level)) {
      validated.mood = {
        level: data.mood.level,
        factors: Array.isArray(data.mood.factors) ? data.mood.factors : []
      };
    }

    // Validate energy
    if (data.energy && ['very_low', 'low', 'neutral', 'high', 'very_high'].includes(data.energy.level)) {
      validated.energy = {
        level: data.energy.level,
        activities: Array.isArray(data.energy.activities) ? data.energy.activities : []
      };
    }

    // Validate sleep
    if (data.sleep && typeof data.sleep.hours === 'number' && 
        ['poor', 'fair', 'good', 'excellent'].includes(data.sleep.quality)) {
      validated.sleep = {
        hours: data.sleep.hours,
        quality: data.sleep.quality,
        issues: Array.isArray(data.sleep.issues) ? data.sleep.issues : []
      };
    }

    // Validate vitals
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

    // Validate tags
    if (data.tags && Array.isArray(data.tags)) {
      validated.tags = data.tags.filter((tag: string) => typeof tag === 'string');
    }

    // Validate mentioned_date
    if (data.mentioned_date && typeof data.mentioned_date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(data.mentioned_date)) {
        validated.mentioned_date = data.mentioned_date;
      }
    }

    // Validate confidence
    if (typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1) {
      validated.confidence = data.confidence;
    }

    return validated;
  }

  async processHealthEntry(userInput: string): Promise<HealthProcessingResult> {
    try {
      // Step 1: Clean and validate input
      const cleanedText = this.cleanText(userInput);
      
      if (!cleanedText || cleanedText.length < 3) {
        return {
          success: false,
          error: "Please provide more detailed health information"
        };
      }

      // Step 2: Create prompt and process with AI
      const prompt = this.createHealthPrompt(cleanedText);
      
      const result = await ai.models.generateContent({
        model: this.model,
        contents: prompt
      });
      const text = result.text;

      // Step 3: Parse and validate JSON response
      try {
        const cleanJsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        const structuredData = JSON.parse(cleanJsonText) as StructuredHealthData;

        // Step 4: Validate and clean data
        const validatedData = this.validateHealthData(structuredData);

        // Step 5: Calculate confidence based on data completeness
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
    let confidence = 0.5; // Base confidence
    let totalFields = 0;
    let filledFields = 0;

    // Check each field type
    const fields = ['symptoms', 'medications', 'appointments', 'mood', 'energy', 'sleep', 'vitals', 'tags'];
    
    fields.forEach(field => {
      if (data[field as keyof StructuredHealthData]) {
        totalFields++;
        filledFields++;
      }
    });

    // Adjust confidence based on field completeness
    if (totalFields > 0) {
      confidence += (filledFields / totalFields) * 0.3;
    }

    // Adjust confidence based on text length and specificity
    if (originalText.length > 50) {
      confidence += 0.1;
    }
    if (originalText.length > 100) {
      confidence += 0.1;
    }

    // Ensure confidence doesn't exceed 1
    return Math.min(confidence, 1);
  }

  async generateHealthSummary(entries: any[]): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      // Create a summary of recent health entries
      const entriesText = entries.map(entry => 
        `Date: ${entry.created_at?.split('T')[0]}, Type: ${entry.entry_type}, Content: ${entry.raw_content}`
      ).join('\n');

      const prompt = `Based on these health entries, generate a concise health summary for a doctor:

${entriesText}

Please provide:
1. A brief patient summary (2-3 sentences)
2. Key health insights or patterns (2-3 bullet points)
3. Recommendations for the patient (2-3 bullet points)

Format as JSON:
{
  "summary": "Patient summary here",
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
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
        summary: "Unable to generate health summary at this time.",
        insights: ["Please review your health entries manually"],
        recommendations: ["Consult with your healthcare provider"]
      };
    }
  }
}

export const healthProcessor = new HealthProcessor();
