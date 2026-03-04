import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({ apiKey });

export interface GenerationParams {
  outfitType: string;
  gender: string;
  pose: string;
  scene: string;
}

export const outfitTypes = ["senator outfit", "kaftan", "agbada", "buba and sokoto", "gown", "two-piece fashion set"];
export const genders = ["male", "female"];
export const poses = ["standing pose", "walking pose", "runway fashion pose"];
export const scenes = ["fashion studio background", "runway scene", "modern outdoor fashion setting"];

export const getRandomParams = (): GenerationParams => ({
  outfitType: outfitTypes[Math.floor(Math.random() * outfitTypes.length)],
  gender: genders[Math.floor(Math.random() * genders.length)],
  pose: poses[Math.floor(Math.random() * poses.length)],
  scene: scenes[Math.floor(Math.random() * scenes.length)],
});

export async function generateFashionDesign(fabricBase64: string, params: GenerationParams) {
  const model = "gemini-2.5-flash-image";
  
  const prompt = `Generate a photorealistic fashion photography image of a ${params.gender} model in a ${params.pose} wearing a ${params.outfitType} made from the fabric pattern in the provided image.

CRITICAL REQUIREMENTS:
- The uploaded fabric image must be used as the textile material for the clothing
- Use the fabric as a repeating textile pattern on the clothing so it appears natural and continuous
- Keep the pattern recognizable and consistent across the outfit
- Apply the fabric pattern ONLY to the clothing
- NEVER apply the fabric pattern to skin, hair, or the background
- Maintain realistic fabric folds, draping, and stitching
- The clothing should look professionally tailored and wearable

Scene: ${params.scene}
Style: Sharp focus, high detail, natural lighting, clean professional composition, fashion catalog quality`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: fabricBase64.split(",")[1],
            mimeType: "image/png",
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function editFashionDesign(imageBase64: string, editPrompt: string) {
  const model = "gemini-2.5-flash-image";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64.split(",")[1],
            mimeType: "image/png",
          },
        },
        { text: editPrompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
