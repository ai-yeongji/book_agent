export interface Book {
  title: string;
  author: string;
  description: string;
  rank: number;
  keyword: string;
  isbn?: string; // ISBN-13 identifier
  coverUrl?: string; // URL of the book cover image
  coverDescription?: string; // Visual description of the cover for AI fallback
}

export interface Scene {
  sceneNumber: number;
  timeRange: string;
  visualDescription: string;
  audioScript: string;
  imagePrompt: string; // The prompt optimized for image generation
  imageUrl?: string; // The generated image URL
}

export interface GeneratedContent {
  type: 'instagram_post' | 'reels_script';
  content: string; // Full text representation
  scenes?: Scene[]; // Structured data for reels
  hashtags?: string[];
  imagePrompt?: string; // Prompt for the main post image
  imageUrl?: string; // Generated main post image URL
  originalCoverUrl?: string; // The original book cover URL for reference display
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  SELECTING = 'SELECTING',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface SearchResult {
  books: Book[];
  sourceUrls: string[];
}