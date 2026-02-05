import { Book, GeneratedContent, Scene } from '../types';

const CACHE_KEY = 'bessel_bestseller_cache_v2';

/**
 * Fetches Kyobo bestsellers from our Vercel API endpoint
 */
export const fetchKyoboBestsellers = async (): Promise<{ books: Book[]; sourceUrls: string[] }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
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

    const apiUrl = '/api/bestsellers';
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

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
 * Generates Instagram content using OpenAI via API endpoint
 */
export const generateSocialContent = async (
  book: Book,
  contentType: 'instagram_post' | 'reels_script'
): Promise<GeneratedContent> => {
  try {
    const apiUrl = '/api/generate-content';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book, contentType })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Error generating social content:", error);
    throw new Error("Failed to generate content.");
  }
};

/**
 * Generates a single image using Gemini via API endpoint
 */
export const generateImage = async (prompt: string, referenceImageUrl?: string, bookTitle?: string): Promise<string | undefined> => {
  try {
    const apiUrl = '/api/generate-image';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        referenceImageUrl,
        bookTitle,
        aspectRatio: '1:1'
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error) {
    console.error("Error generating image:", error);
    return undefined;
  }
};

/**
 * Generates images for multiple scenes using Gemini via API endpoint
 */
export const generateImagesForScenes = async (scenes: Scene[], referenceImageUrl?: string, bookTitle?: string): Promise<Scene[]> => {
  try {
    const updatedScenes = await Promise.all(scenes.map(async (scene) => {
      try {
        const apiUrl = '/api/generate-image';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: scene.imagePrompt,
            referenceImageUrl,
            bookTitle,
            aspectRatio: '9:16'
          })
        });

        if (!response.ok) {
          console.error(`Failed to generate image for scene ${scene.sceneNumber}`);
          return scene;
        }

        const data = await response.json();
        return { ...scene, imageUrl: data.imageUrl };

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
