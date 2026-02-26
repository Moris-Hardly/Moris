import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translateText(text: string, targetLang: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLang}. Return ONLY the translated text without any explanations or quotes: "${text}"`,
    });
    return response.text?.trim() || "Translation failed";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error during translation";
  }
}

export async function generateNMTQuestions(): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 5 NMT (National Multi-Subject Test) style questions for Ukrainian students. Include questions on Ukrainian language, history, and math. Return as a JSON array of objects with properties: q (question), a (array of 3 answers), c (index of correct answer).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              q: { type: Type.STRING },
              a: { type: Type.ARRAY, items: { type: Type.STRING } },
              c: { type: Type.INTEGER }
            },
            required: ["q", "a", "c"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating NMT questions:", error);
    return [];
  }
}

export async function generateWriters(lang: string): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 5 famous Ukrainian writers in ${lang}. For each, provide: name, years of life, 3 major works, and one interesting fact. Return as a JSON array of objects with properties: name, years, works, fact, img (use a descriptive picsum url like https://picsum.photos/seed/[name]/200/200).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              years: { type: Type.STRING },
              works: { type: Type.STRING },
              fact: { type: Type.STRING },
              img: { type: Type.STRING }
            },
            required: ["name", "years", "works", "fact", "img"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating writers:", error);
    return [];
  }
}

export async function generateHistoricalFigures(lang: string): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 5 famous Ukrainian historical figures in ${lang}. For each, provide: name, years of life, and one major achievement. Return as a JSON array of objects with properties: name, years, fact, img (use a descriptive picsum url like https://picsum.photos/seed/[name]/200/200).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              years: { type: Type.STRING },
              fact: { type: Type.STRING },
              img: { type: Type.STRING }
            },
            required: ["name", "years", "fact", "img"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating figures:", error);
    return [];
  }
}

export async function generateHistoryDates(lang: string): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 8 important dates in Ukrainian history in ${lang}. Return as a JSON array of objects with properties: date, event, category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              event: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["date", "event", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating dates:", error);
    return [];
  }
}

export async function generateInterestingFact(lang: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tell me one interesting and surprising fact for teenagers in ${lang}. Keep it short and engaging.`,
    });
    return response.text?.trim() || "Did you know that honey never spoils?";
  } catch (error) {
    return "Learning is the superpower of the 21st century!";
  }
}
