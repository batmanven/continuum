import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const medicationProcessor = {
  async fetchOpenFDAInteractions(drugName: string): Promise<string | null> {
    try {
      const resp = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(drugName)}"&limit=1`);
      if (!resp.ok) return null;
      const json = await resp.json();
      const results = json.results;
      if (results && results.length > 0) {
        return results[0].drug_interactions ? results[0].drug_interactions.join("\n") : "No explicit strict interactions found on main FDA label.";
      }
      return null;
    } catch {
      return null;
    }
  },

  async analyzeInteractions(newDrugName: string, activeDrugs: string[]): Promise<{
    hasInteraction: boolean;
    severity: 'low' | 'moderate' | 'high' | 'none';
    description: string;
  }> {
    if (!ai) {
      return { hasInteraction: false, severity: 'none', description: 'Could not perform Safety Check (AI offline).' };
    }
    
    if (activeDrugs.length === 0) {
      return { hasInteraction: false, severity: 'none', description: 'No other active medications to conflict with.' };
    }

    try {
      const fdaData = await this.fetchOpenFDAInteractions(newDrugName);
      
      const prompt = `You are a clinical pharmacist API. 
The patient wants to start taking: ${newDrugName}.
They currently take: ${activeDrugs.join(', ')}.

Here is the raw OpenFDA Drug Interaction label for ${newDrugName}:
"""${fdaData || 'No FDA label provided'}"""

Analyze the combination of ${newDrugName} with their current list: [${activeDrugs.join(', ')}].
Return valid strict JSON only, with no markdown code blocks formatting. Use this schema:
{
  "hasInteraction": boolean,
  "severity": "high" | "moderate" | "low" | "none",
  "description": "Short 1-2 sentence warning or medical clearance."
}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || "{}";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanedText);
      
      return {
        hasInteraction: result.hasInteraction || false,
        severity: result.severity || 'none',
        description: result.description || 'No noticeable interactions.'
      };
      
    } catch (e) {
      console.error(e);
      return { hasInteraction: false, severity: 'none', description: 'Failed to complete safety check.' };
    }
  }
};
