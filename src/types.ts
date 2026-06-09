export interface Category {
  id: string;
  name: string;
  color: string; // for pill highlights, e.g., amber, emerald, teal
}

export type PoemMood = 'Reflective' | 'Melancholy' | 'Romantic' | 'Hopeful' | 'Whimsical' | 'Mystical' | 'Free';

export interface PoemAttachment {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string; // base64 representation or blob URL
  size?: number;
}

export interface Poem {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  tags: string[];
  mood?: PoemMood;
  author?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
  attachments?: PoemAttachment[];
  isPhotoCapture?: boolean;
  isPrivate?: boolean;
}
