import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GenerationParams {
  outfitType: string;
  gender: string;
  pose: string;
  scene: string;
}

export const outfitTypes = ["senator wear", "kaftan", "agbada", "gown", "two-piece set"];
export const genders = ["male", "female"];
export const poses = ["standing", "walking", "runway pose"];
export const scenes = ["fashion studio", "runway", "clean outdoor setting"];

export const getRandomParams = (): GenerationParams => ({
  outfitType: outfitTypes[Math.floor(Math.random() * outfitTypes.length)],
  gender: genders[Math.floor(Math.random() * genders.length)],
  pose: poses[Math.floor(Math.random() * poses.length)],
  scene: scenes[Math.floor(Math.random() * scenes.length)],
});

export async function generateFashionDesign(fabricBase64: string, params: GenerationParams) {
  const model = "gemini-2.5-flash-image";
  
  const prompt = `Generate a high-quality, photorealistic fashion photograph of a ${params.gender} model in a ${params.pose} wearing a ${params.outfitType} made from the fabric pattern in the provided image. 
  The fabric pattern should be a repeating textile pattern on the clothing. 
  Keep the pattern recognizable and realistic. 
  Apply the fabric only to the clothing. 
  Never place the fabric pattern on skin or background.
  The scene is a ${params.scene}. 
  Natural lighting, realistic cloth folds, professional tailoring appearance.`;

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
