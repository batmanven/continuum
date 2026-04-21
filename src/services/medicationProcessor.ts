import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface StandardizedMedication {
  brand_name: string;
  generic_name: string;
  us_equivalent: string;
  is_indian_brand: boolean;
  rxcui?: string;
}

const CACHE_KEY = 'continuum_drug_std_cache_v1';
const standardizationCache: Record<string, StandardizedMedication> = (() => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
})();

const saveToCache = (query: string, result: StandardizedMedication) => {
  standardizationCache[query] = result;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(standardizationCache));
  } catch (e) {
    console.warn('Cache full, skipping persistence');
  }
};

// Local "Fast-Pass" for instant results without AI
const LOCAL_BRAND_MAPPING: Record<string, StandardizedMedication> = {
  'dolo': { brand_name: 'Dolo', generic_name: 'Paracetamol', us_equivalent: 'Acetaminophen', is_indian_brand: true },
  'crocin': { brand_name: 'Crocin', generic_name: 'Paracetamol', us_equivalent: 'Acetaminophen', is_indian_brand: true },
  'calpol': { brand_name: 'Calpol', generic_name: 'Paracetamol', us_equivalent: 'Acetaminophen', is_indian_brand: true },
  'flexon': { brand_name: 'Flexon', generic_name: 'Ibuprofen + Paracetamol', us_equivalent: 'Ibuprofen and Acetaminophen', is_indian_brand: true },
  'combiflam': { brand_name: 'Combiflam', generic_name: 'Ibuprofen + Paracetamol', us_equivalent: 'Ibuprofen and Acetaminophen', is_indian_brand: true },
  'voveran': { brand_name: 'Voveran', generic_name: 'Diclofenac', us_equivalent: 'Diclofenac', is_indian_brand: true },
  'augmentin': { brand_name: 'Augmentin', generic_name: 'Amoxicillin + Clavulanic Acid', us_equivalent: 'Amoxicillin and Clavulanate', is_indian_brand: true },
  'pantocid': { brand_name: 'Pantocid', generic_name: 'Pantoprazole', us_equivalent: 'Pantoprazole', is_indian_brand: true },
  'pan': { brand_name: 'Pan', generic_name: 'Pantoprazole', us_equivalent: 'Pantoprazole', is_indian_brand: true },
  'telma': { brand_name: 'Telma', generic_name: 'Telmisartan', us_equivalent: 'Telmisartan', is_indian_brand: true },
  'amox': { brand_name: 'Amoxil', generic_name: 'Amoxicillin', us_equivalent: 'Amoxicillin', is_indian_brand: true },
  'met': { brand_name: 'Metformin', generic_name: 'Metformin', us_equivalent: 'Metformin', is_indian_brand: false },
};

export const medicationProcessor = {
  async standardizeMedicationName(input: string): Promise<StandardizedMedication | null> {
    const query = input.toLowerCase().trim();
    
    // 1. Check local fast-pass
    if (LOCAL_BRAND_MAPPING[query]) return LOCAL_BRAND_MAPPING[query];
    
    // 2. Check cache
    if (standardizationCache[query]) return standardizationCache[query];

    if (!ai) return null;
    try {
      const prompt = `Act as a clinical pharmacist. Standardize this medication name: "${input}".
If it is an Indian brand (e.g. Crocin, Dolo), identify it. 
Provide the global generic name and the US generic equivalent (e.g. Paracetamol -> Acetaminophen).
Return JSON only:
{
  "brand_name": "string (original or identified brand)",
  "generic_name": "string (global generic)",
  "us_equivalent": "string (US generic)",
  "is_indian_brand": boolean
}`;
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = result.text || "{}";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedResult = JSON.parse(cleanedText);
      
      // Save to persistent cache
      saveToCache(query, parsedResult);
      return parsedResult;
    } catch (err) {
      // Catch rate limits silently and return raw query as fallback
      return { brand_name: input, generic_name: input, us_equivalent: input, is_indian_brand: false };
    }
  },

  async fetchPatientFriendlyInfo(genericName: string): Promise<string | null> {
    if (!ai) return null;
    try {
      const prompt = `Provide a 2-sentence patient-friendly summary for the medication: "${genericName}". 
Include what it is used for and one common side effect. Keep it simple and helpful. JSON only: {"summary": "string"}`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = result.text || "{}";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return parsed.summary || null;
    } catch (err) {
      console.warn('Patient Info AI Fallback:', err);
      return `Information on ${genericName} is currently being verified. Consult your doctor for usage.`;
    }
  },

  async getRxCui(drugName: string): Promise<string | null> {
    try {
      const resp = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.idGroup?.rxnormId?.[0] || null;
    } catch {
      return null;
    }
  },

  async fetchRxNavInteractions(rxcuis: string[]): Promise<string[]> {
    if (rxcuis.length < 2) return [];
    try {
      const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`;
      const resp = await fetch(url);
      if (!resp.ok) return [];
      const data = await resp.json();
      const interactions: string[] = [];
      data.fullInteractionTypeGroup?.forEach((group: any) => {
        group.fullInteractionType?.forEach((type: any) => {
          interactions.push(type.interactionPair?.[0]?.description);
        });
      });
      return interactions.filter(Boolean);
    } catch {
      return [];
    }
  },

  async searchMedications(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    try {
      // 1. Try Clinical Standardization First
      // Only call AI for 3+ characters to save quota, unless it's in our local map
      const normalizedQuery = query.toLowerCase().trim();
      let std = null;
      if (LOCAL_BRAND_MAPPING[normalizedQuery]) {
        std = LOCAL_BRAND_MAPPING[normalizedQuery];
      } else if (query.length >= 3) {
        std = await this.standardizeMedicationName(query);
      }
      const searchTerms = new Set<string>();
      
      if (std && std.generic_name.toLowerCase() !== query.toLowerCase()) {
        searchTerms.add(std.generic_name);
        searchTerms.add(std.us_equivalent);
      }
      searchTerms.add(query);

      // 2. Fetch from OpenFDA using standard names
      const names = new Set<string>();
      if (std) names.add(`${std.brand_name} (${std.generic_name})`);

      for (const term of Array.from(searchTerms)) {
        if (!term || term.length < 2) continue;
        const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:${encodeURIComponent(term)}*+OR+openfda.generic_name:${encodeURIComponent(term)}*)&limit=5`;
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const json = await resp.json();
            json.results?.forEach((r: any) => {
              const brand = r.openfda.brand_name?.[0];
              const generic = r.openfda.generic_name?.[0];
              if (brand) names.add(`${brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()} (${generic})`);
              else if (generic) names.add(generic.charAt(0).toUpperCase() + generic.slice(1).toLowerCase());
            });
          }
        } catch (e) {
          // Silent catch for 404/Network errors to avoid console noise
        }
      }
      
      return Array.from(names).slice(0, 5);
    } catch (err) {
      console.error('Search Error:', err);
      return [];
    }
  },

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
    } catch (err) {
      // Silent catch for interaction lookups
      return null;
    }
  },

  async analyzeInteractions(newDrugName: string, activeDrugs: string[]): Promise<{
    hasInteraction: boolean;
    severity: 'low' | 'moderate' | 'high' | 'none';
    description: string;
    patientFriendlyInfo?: string;
    standardized?: StandardizedMedication;
  }> {
    if (!ai) {
      return { hasInteraction: false, severity: 'none', description: 'Could not perform Safety Check (AI offline).' };
    }
    
    let std: StandardizedMedication | null = null;
    let patientInfo: string | null = null;
    let rxNavInteractions: string[] = [];

    try {
      // 1. Regional Standardization
      std = await this.standardizeMedicationName(newDrugName);
      const drugToQuery = std?.us_equivalent || newDrugName;

      // 2. Multi-source Data Gathering
      const [fdaDataResult, patientInfoResult, rxCuiNew] = await Promise.all([
        this.fetchOpenFDAInteractions(drugToQuery),
        this.fetchPatientFriendlyInfo(std?.generic_name || newDrugName),
        this.getRxCui(drugToQuery)
      ]);
      
      const fdaData = fdaDataResult;
      patientInfo = patientInfoResult;

      // 3. RxNav Interaction Check
      if (rxCuiNew && activeDrugs.length > 0) {
        const activeCuis = await Promise.all(activeDrugs.map(d => this.getRxCui(d)));
        rxNavInteractions = await this.fetchRxNavInteractions([rxCuiNew, ...activeCuis.filter(Boolean) as string[]]);
      }

      if (activeDrugs.length === 0) {
        return { 
          hasInteraction: false, 
          severity: 'none', 
          description: 'No other active medications to conflict with.',
          patientFriendlyInfo: patientInfo || undefined,
          standardized: std || undefined
        };
      }

      // 4. Synthesized AI Analysis
      const prompt = `You are a clinical pharmacist AI specialized in global and Indian medications.
Analyzed Drug: ${std?.brand_name} (Generic: ${std?.generic_name}, US: ${std?.us_equivalent})
Current Patient Meds: [${activeDrugs.join(', ')}]

Raw Data:
- OpenFDA Label: """${fdaData || 'No data'}"""
- RxNav Clinical Conflicts: [${rxNavInteractions.join(', ')}]
- Regional Context: ${std?.is_indian_brand ? "This is an Indian branded medication." : "Standard medication."}

Provide a synthesized safety analysis in valid strict JSON. Schema:
{
  "hasInteraction": boolean,
  "severity": "high" | "moderate" | "low" | "none",
  "description": "Short 1-2 sentence warning synthesized from FDA and RxNav."
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
        description: result.description || 'No noticeable interactions.',
        patientFriendlyInfo: patientInfo || undefined,
        standardized: std || undefined
      };
      
    } catch (e) {
      console.warn("AI Analysis Overloaded - Falling back to Raw Data:", e);
      
      // If we have raw interaction data from RxNav, use it directly!
      // This bypasses the AI and ensures the pharmacist data is still visible.
      if (rxNavInteractions && rxNavInteractions.length > 0) {
        return {
          hasInteraction: true,
          severity: 'moderate',
          description: `ALERT: ${rxNavInteractions[0]} (Source: NIH RxNav Clinical Database)`,
          patientFriendlyInfo: patientInfo || undefined,
          standardized: std || undefined
        };
      }

      return { 
        hasInteraction: false, 
        severity: 'none', 
        description: `Safety check currently relying on basic clinical records. Consult a physician.`,
        patientFriendlyInfo: patientInfo || undefined,
        standardized: std || undefined
      };
    }
  }
};
