import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_IMAGE = 'gemini-2.5-flash-image';

/**
 * Generate social media content using OpenAI
 */
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
    const { book, contentType } = req.body;

    let systemPrompt = "";
    let userPrompt = "";

    const visualContext = book.coverDescription ? `The book cover looks like: "${book.coverDescription}".` : "";

    if (contentType === 'instagram_post') {
      systemPrompt = `You are a professional "Book Curator" or "Bookstore Editor" creating Instagram posts.

IMPORTANT TONE & STYLE GUIDE (Korean):
- Do NOT write a personal review (e.g., do not say "I read this", "I felt", "My opinion is").
- Write it as a formal yet engaging "Book Introduction" or "Recommendation".
- The tone should be objective, informative, and curatorial (using polite "존댓말" like ~해요, ~입니다).
- Focus on the book's key themes, why it's popular, and the target audience.`;

      userPrompt = `Create an Instagram Post for the book: "${book.title}" by ${book.author}.
The book is currently a bestseller in Korea.
${visualContext}

Return a JSON object with:
{
  "caption": "The full post text including Hook, Body, and Closing",
  "hashtags": "A string of 10-15 relevant Korean hashtags",
  "imagePrompt": "A high-quality English prompt to generate an aesthetic book cover photo. Must explicitly state to display the book cover clearly in the center or as the hero object. Style it artistically (e.g. soft lighting, on a wooden desk, with coffee, or a modern minimalist background)."
}`;

    } else {
      systemPrompt = "You are a viral content creator specializing in short-form video content.";

      userPrompt = `Create a 30-second Instagram Reels Script for the book: "${book.title}" by ${book.author}.
${visualContext}
Divide the script into 4-5 distinct scenes.

Return a JSON object with:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0-5s",
      "visualDescription": "Detailed description in Korean",
      "audioScript": "The voiceover text in Korean",
      "imagePrompt": "A high-quality English prompt to generate an image for this scene. If the scene mentions the book, include the book cover prominently."
    }
  ]
}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonText = completion.choices[0].message.content || "{}";
    const json = JSON.parse(jsonText);

    let content = "";
    let scenes = [];
    let imagePrompt = "";

    if (contentType === 'instagram_post') {
      content = `${json.caption}\n\n${json.hashtags}`;
      imagePrompt = json.imagePrompt;
    } else {
      scenes = json.scenes || [];
      content = scenes.map((s: any) =>
        `[${s.timeRange}] Scene ${s.sceneNumber}\nVisual: ${s.visualDescription}\nAudio: ${s.audioScript}`
      ).join("\n\n");
    }

    return res.status(200).json({
      type: contentType,
      content,
      scenes,
      imagePrompt,
      originalCoverUrl: book.coverUrl,
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
