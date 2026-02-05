import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_IMAGE = 'imagen-3.0-generate-001'; // Imagen 3 모델

async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.warn("Could not fetch reference image:", error);
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, referenceImageUrl, bookTitle, aspectRatio = '1:1' } = req.body;

    const parts: any[] = [{ text: prompt }];

    if (referenceImageUrl) {
      const base64Data = await fetchImageBase64(referenceImageUrl);
      if (base64Data) {
        parts.unshift({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });

        parts[1].text = `[Reference Image: Book cover for "${bookTitle}"]

Create a beautiful Instagram post image featuring this book.

IMPORTANT:
- Include the book cover from the reference image in the scene
- Place it on an aesthetic surface (wooden table, marble counter, or cozy reading nook)
- Add atmospheric elements: soft natural lighting, coffee/tea cup, reading glasses, bookmark, cozy blanket, plants
- Style: Professional product photography, Instagram aesthetic, warm and inviting

Scene idea: ${parts[1].text}`;
      }
    }

    const response = await gemini.models.generateContent({
      model: MODEL_IMAGE,
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.status(200).json({
          imageUrl: `data:image/png;base64,${part.inlineData.data}`
        });
      }
    }

    return res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
