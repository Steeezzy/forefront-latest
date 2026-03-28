export interface SarvamVoice {
  id: string;
  name: string;
  category: 'conversational' | 'sales' | 'news' | 'support' | 'narration';
  gender: 'male' | 'female';
  language: string;
  languages: string[];
  tone: string;
  sampleUrl?: string;
}

export const SARVAM_VOICES: SarvamVoice[] = [
  // Conversational
  { id: 'shubh', name: 'Shubh', gender: 'male', category: 'conversational', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'warm', sampleUrl: '' },
  { id: 'priya', name: 'Priya', gender: 'female', category: 'conversational', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'friendly', sampleUrl: '' },
  { id: 'ananya', name: 'Ananya', gender: 'female', category: 'conversational', language: 'Hindi', languages: ['Hindi'], tone: 'calm', sampleUrl: '' },
  { id: 'kavya', name: 'Kavya', gender: 'female', category: 'conversational', language: 'Hindi', languages: ['Hindi'], tone: 'cheerful', sampleUrl: '' },
  { id: 'rohan', name: 'Rohan', gender: 'male', category: 'conversational', language: 'Hindi', languages: ['Hindi'], tone: 'steady', sampleUrl: '' },

  // Sales
  { id: 'tarun', name: 'Tarun', gender: 'male', category: 'sales', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'confident', sampleUrl: '' },
  { id: 'ishita', name: 'Ishita', gender: 'female', category: 'sales', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'persuasive', sampleUrl: '' },
  { id: 'deepak', name: 'Deepak', gender: 'male', category: 'sales', language: 'Hindi', languages: ['Hindi'], tone: 'enthusiastic', sampleUrl: '' },
  { id: 'sneha', name: 'Sneha', gender: 'female', category: 'sales', language: 'Hindi', languages: ['Hindi'], tone: 'professional', sampleUrl: '' },
  { id: 'vikram', name: 'Vikram', gender: 'male', category: 'sales', language: 'Hindi', languages: ['Hindi'], tone: 'authoritative', sampleUrl: '' },

  // News/Anchors
  { id: 'gokul', name: 'Gokul', gender: 'male', category: 'news', language: 'Hindi', languages: ['Hindi'], tone: 'formal', sampleUrl: '' },
  { id: 'nandini', name: 'Nandini', gender: 'female', category: 'news', language: 'Hindi', languages: ['Hindi'], tone: 'articulate', sampleUrl: '' },
  { id: 'suresh', name: 'Suresh', gender: 'male', category: 'news', language: 'Hindi', languages: ['Hindi'], tone: 'steady', sampleUrl: '' },
  { id: 'meera', name: 'Meera', gender: 'female', category: 'news', language: 'Hindi', languages: ['Hindi'], tone: 'clear', sampleUrl: '' },

  // Support
  { id: 'arjun', name: 'Arjun', gender: 'male', category: 'support', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'helpful', sampleUrl: '' },
  { id: 'divya', name: 'Divya', gender: 'female', category: 'support', language: 'Hindi', languages: ['Hindi', 'English'], tone: 'patient', sampleUrl: '' },
  { id: 'ravi', name: 'Ravi', gender: 'male', category: 'support', language: 'Hindi', languages: ['Hindi'], tone: 'supportive', sampleUrl: '' },
  { id: 'pooja', name: 'Pooja', gender: 'female', category: 'support', language: 'Hindi', languages: ['Hindi'], tone: 'reassuring', sampleUrl: '' },
  { id: 'amit', name: 'Amit', gender: 'male', category: 'support', language: 'Hindi', languages: ['Hindi'], tone: 'polite', sampleUrl: '' },

  // Narration
  { id: 'lakshmi', name: 'Lakshmi', gender: 'female', category: 'narration', language: 'Hindi', languages: ['Hindi'], tone: 'storyteller', sampleUrl: '' },
  { id: 'sanjay', name: 'Sanjay', gender: 'male', category: 'narration', language: 'Hindi', languages: ['Hindi'], tone: 'deep', sampleUrl: '' },
  { id: 'rekha', name: 'Rekha', gender: 'female', category: 'narration', language: 'Hindi', languages: ['Hindi'], tone: 'melodic', sampleUrl: '' },
  { id: 'mohan', name: 'Mohan', gender: 'male', category: 'narration', language: 'Hindi', languages: ['Hindi'], tone: 'rhythmic', sampleUrl: '' },
  { id: 'sita', name: 'Sita', gender: 'female', category: 'narration', language: 'Hindi', languages: ['Hindi'], tone: 'gentle', sampleUrl: '' },
];

export const VOICE_CATEGORIES = ['Conversational', 'Audiobooks', 'Entertainment', 'Sales', 'News'] as const;
