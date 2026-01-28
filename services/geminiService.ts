import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Book, GeneratedContent, Scene } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_CREATIVE = 'gemini-3-flash-preview'; 
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 

const CACHE_KEY = 'kyobo_bestseller_daily_cache';

/**
 * Helper to fetch image as base64 string for Gemini API.
 * Handles CORS errors gracefully by returning null.
 */
async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Split to get only the base64 data part
        const data = res.split(',')[1];
        resolve(data);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not fetch reference image (likely CORS), falling back to prompt description:", error);
    return null;
  }
}

/**
 * Searches for current bestsellers using Gemini with Google Search Grounding.
 * Implements daily caching: Returns cached data if available for the current date.
 */
export const fetchKyoboBestsellers = async (): Promise<{ books: Book[]; sourceUrls: string[] }> => {
  try {
    // 1. Check Cache
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const cachedRaw = localStorage.getItem(CACHE_KEY);

    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached.date === today && cached.data) {
          console.log("Returning cached bestseller data for:", today);
          return cached.data;
        }
      } catch (e) {
        console.warn("Invalid cache data, proceeding to fetch.");
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. Fetch from API if cache misses
    // Optimized Strategy: Ask for ISBN specifically AND a direct cover URL if found.
    const prompt = `
      Find the current "Weekly Bestsellers" (주간 베스트셀러) top 5 books at "Kyobo Book Centre" (교보문고) in South Korea.
      Return a JSON object containing an array of books.
      
      For each book, include:
      - title: The full Korean title.
      - author: The author's name.
      - description: A brief 1-sentence summary of what the book is about.
      - rank: The ranking (1-5).
      - keyword: A short 2-3 word keyword describing the genre or vibe.
      - isbn: The 13-digit ISBN number of the book (starts with 978 or 979). This is CRITICAL for image loading.
      - coverUrl: Try to find the direct URL of the book cover image (ending in .jpg or .png) from the search results.
      - coverDescription: A short visual description of what the book cover looks like (colors, objects, style).
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        books: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              description: { type: Type.STRING },
              rank: { type: Type.INTEGER },
              keyword: { type: Type.STRING },
              isbn: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              coverDescription: { type: Type.STRING },
            },
            required: ["title", "author", "description", "rank", "keyword"],
          },
        },
      },
      required: ["books"],
    };

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    // Post-process to construct Kyobo Image URLs from ISBN if the model didn't provide a working URL
    // Pattern: https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/{ISBN}.jpg
    const books = (data.books || []).map((book: Book) => {
      let finalCoverUrl = book.coverUrl;

      // If model didn't provide a URL, or provided a suspicious one, try to construct it from ISBN
      if (!finalCoverUrl || !finalCoverUrl.startsWith('http')) {
        if (book.isbn) {
          // Remove any hyphens just in case
          const cleanIsbn = book.isbn.replace(/[^0-9]/g, '');
          if (cleanIsbn.length >= 10) {
             finalCoverUrl = `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/${cleanIsbn}.jpg`;
          }
        }
      }

      return {
        ...book,
        coverUrl: finalCoverUrl
      };
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls: string[] = [];
    chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
            sourceUrls.push(chunk.web.uri);
        }
    });

    const uniqueUrls = Array.from(new Set(sourceUrls)).slice(0, 3);
    const result = {
      books: books,
      sourceUrls: uniqueUrls,
    };

    // 3. Save to Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      date: today,
      data: result
    }));

    return result;

  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    throw new Error("Failed to fetch bestseller data.");
  }
};

/**
 * Generates Instagram content (Post or Reel).
 */
export const generateSocialContent = async (
  book: Book,
  contentType: 'instagram_post' | 'reels_script'
): Promise<GeneratedContent> => {
  try {
    let prompt = "";
    let responseSchema: Schema | undefined;

    // We pass the cover description to the content generator so it can write better visual instructions
    const visualContext = book.coverDescription ? `The book cover looks like: "${book.coverDescription}".` : "";

    if (contentType === 'instagram_post') {
      prompt = `
        Act as a professional "Book Curator" or "Bookstore Editor".
        Create an Instagram Post for the book: "${book.title}" by ${book.author}.
        The book is currently a bestseller in Korea.
        ${visualContext}
        
        IMPORTANT TONE & STYLE GUIDE (Korean):
        - Do NOT write a personal review (e.g., do not say "I read this", "I felt", "My opinion is").
        - Write it as a formal yet engaging "Book Introduction" or "Recommendation" (e.g., "Introducing this week's bestseller", "Here is why this book is trending", "Recommended for people who...").
        - The tone should be objective, informative, and curatorial (using polite "존댓말" like ~해요, ~입니다).
        - Focus on the book's key themes, why it's popular, and the target audience.

        Return a JSON object with:
        - caption: The full post text including Hook, Body, and Closing.
        - hashtags: A string of 10-15 relevant Korean hashtags.
        - imagePrompt: A high-quality English prompt to generate an aesthetic book cover photo. 
          The prompt MUST explicitly state to display the book cover clearly in the center or as the hero object.
          Use the description: "${book.coverDescription || book.title} book cover".
          Style it artistically (e.g. soft lighting, on a wooden desk, with coffee, or a modern minimalist background).
      `;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          caption: { type: Type.STRING },
          hashtags: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["caption", "hashtags", "imagePrompt"]
      };
    } else {
      prompt = `
        Act as a viral content creator.
        Create a 30-second Instagram Reels Script for the book: "${book.title}" by ${book.author}.
        ${visualContext}
        Divide the script into 4-5 distinct scenes.

        Return a JSON object with a "scenes" array.
        For each scene, provide:
        - sceneNumber: Integer
        - timeRange: e.g., "0-5s"
        - visualDescription: Detailed description (Korean).
        - audioScript: The voiceover text (Korean).
        - imagePrompt: A high-quality English prompt to generate an image for this scene.
          If the scene mentions the book, use the cover description: "${book.coverDescription || book.title}".
      `;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                timeRange: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                audioScript: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
              },
              required: ["sceneNumber", "timeRange", "visualDescription", "audioScript", "imagePrompt"],
            },
          },
        },
        required: ["scenes"],
      };
    }

    const response = await ai.models.generateContent({
      model: MODEL_CREATIVE,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text || "{}";
    let content = "";
    let scenes: Scene[] = [];
    let imagePrompt = "";

    try {
      const json = JSON.parse(jsonText);
      
      if (contentType === 'instagram_post') {
        content = `${json.caption}\n\n${json.hashtags}`;
        imagePrompt = json.imagePrompt;
      } else {
        scenes = json.scenes || [];
        content = scenes.map(s => 
          `[${s.timeRange}] Scene ${s.sceneNumber}\nVisual: ${s.visualDescription}\nAudio: ${s.audioScript}`
        ).join("\n\n");
      }
    } catch (e) {
      console.error("Failed to parse response JSON", e);
      content = response.text || "Generation failed";
    }

    return {
      type: contentType,
      content: content,
      scenes: scenes.length > 0 ? scenes : undefined,
      imagePrompt: imagePrompt || undefined,
      originalCoverUrl: book.coverUrl, // Pass original URL for UI display
    };

  } catch (error) {
    console.error("Error generating social content:", error);
    throw new Error("Failed to generate content.");
  }
};

/**
 * Generates a single image from a prompt, optionally using a reference image URL.
 */
export const generateImage = async (prompt: string, referenceImageUrl?: string): Promise<string | undefined> => {
  try {
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
        // Strongly instruct the model to use the reference image
        parts[1].text = `[Reference Image Provided] \n\nInstruction: Create a high-quality composition based on the prompt below. \nCRITICAL: You MUST include the book cover from the reference image in the scene. Preserve the title "${prompt.substring(0, 20)}..." and visual identity of the book cover as strictly as possible.\n\nPrompt: ${parts[1].text}`;
      }
    }

    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Failed to generate single image", e);
  }
  return undefined;
};

/**
 * Generates images for a list of scenes, optionally using a reference image URL.
 */
export const generateImagesForScenes = async (scenes: Scene[], referenceImageUrl?: string): Promise<Scene[]> => {
  try {
    let referenceImageBase64: string | null = null;
    if (referenceImageUrl) {
      referenceImageBase64 = await fetchImageBase64(referenceImageUrl);
    }

    const updatedScenes = await Promise.all(scenes.map(async (scene) => {
      try {
        const parts: any[] = [{ text: scene.imagePrompt }];
        
        if (referenceImageBase64) {
             parts.unshift({
              inlineData: {
                mimeType: 'image/jpeg',
                data: referenceImageBase64
              }
            });
            // Strongly instruct the model to use the reference image
            parts[1].text = `[Reference Image Provided] \n\nInstruction: Generate a scene for a video storyboard. \nCRITICAL: If the book is present in the scene, it MUST look exactly like the reference image provided. Maintain the cover art and title text fidelity.\n\nPrompt: ${parts[1].text}`;
        }

        const response = await ai.models.generateContent({
          model: MODEL_IMAGE,
          contents: { parts: parts },
          config: {
            imageConfig: {
              aspectRatio: "9:16",
            }
          }
        });
        
        let imageUrl = undefined;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        return { ...scene, imageUrl };
      } catch (e) {
        console.error(`Failed to generate image for scene ${scene.sceneNumber}`, e);
        return scene;
      }
    }));

    return updatedScenes;
  } catch (error) {
    console.error("Error in batch image generation:", error);
    return scenes;
  }
};
