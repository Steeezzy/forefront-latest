export interface SarvamVoice {
    id: string;
    name: string;
    gender: 'male' | 'female';
    category: 'Conversational' | 'Audiobooks' | 'Entertainment' | 'Sales' | 'News';
    description: string;
    recommended?: boolean;
}

export const SARVAM_VOICES: SarvamVoice[] = [
    // Conversational
    { id: 'shubh', name: 'Shubh', gender: 'male', category: 'Conversational', description: 'Friendly default voice for IVR and support', recommended: true },
    { id: 'priya', name: 'Priya', gender: 'female', category: 'Conversational', description: 'Upbeat voice with personality', recommended: true },
    { id: 'suhani', name: 'Suhani', gender: 'female', category: 'Conversational', description: 'Pleasant and soothing voice', recommended: true },
    { id: 'ashutosh', name: 'Ashutosh', gender: 'male', category: 'Conversational', description: 'Traditional Hindi narration style', recommended: true },
    { id: 'ritu', name: 'Ritu', gender: 'female', category: 'Conversational', description: 'Soft, approachable voice for customer interactions', recommended: true },
    { id: 'amit', name: 'Amit', gender: 'male', category: 'Conversational', description: 'Formal voice for business communications', recommended: true },
    { id: 'sumit', name: 'Sumit', gender: 'male', category: 'Conversational', description: 'Balanced warmth with professionalism', recommended: true },
    { id: 'pooja', name: 'Pooja', gender: 'female', category: 'Conversational', description: 'Encouraging voice for assistance flows', recommended: true },
    { id: 'neha', name: 'Neha', gender: 'female', category: 'Conversational', description: 'Clear and articulate customer service voice' },
    { id: 'rahul', name: 'Rahul', gender: 'male', category: 'Conversational', description: 'Energetic and youthful male voice' },
    { id: 'rohan', name: 'Rohan', gender: 'male', category: 'Conversational', description: 'Deep, steady voice for reliability' },
    { id: 'simran', name: 'Simran', gender: 'female', category: 'Conversational', description: 'Calm and steady conversational tone' },
    { id: 'kavya', name: 'Kavya', gender: 'female', category: 'Conversational', description: 'Warm and friendly feminine voice' },
    { id: 'dev', name: 'Dev', gender: 'male', category: 'Conversational', description: 'Natural and casual storytelling style' },

    // Audiobooks
    { id: 'advait', name: 'Advait', gender: 'male', category: 'Audiobooks', description: 'Deep, expressive narration for stories', recommended: true },
    { id: 'roopa', name: 'Roopa', gender: 'female', category: 'Audiobooks', description: 'Rich, melodic voice for long-form content', recommended: true },
    { id: 'kabir', name: 'Kabir', gender: 'male', category: 'Audiobooks', description: 'Authoritative and engaging narrator' },
    { id: 'anand', name: 'Anand', gender: 'male', category: 'Audiobooks', description: 'Steady and clear educational narration' },
    { id: 'tanya', name: 'Tanya', gender: 'female', category: 'Audiobooks', description: 'Expressive and dramatic story reader' },
    { id: 'shreya', name: 'Shreya', gender: 'female', category: 'Audiobooks', description: 'Soft and engaging narration style' },

    // Entertainment
    { id: 'amelia', name: 'Amelia', gender: 'female', category: 'Entertainment', description: 'High-energy and expressive for media', recommended: true },
    { id: 'sophia', name: 'Sophia', gender: 'female', category: 'Entertainment', description: 'Playful and bright entertainment voice' },
    { id: 'ratan', name: 'Ratan', gender: 'male', category: 'Entertainment', description: 'Unique and character-driven vocal style' },
    { id: 'varun', name: 'Varun', gender: 'male', category: 'Entertainment', description: 'Dynamic and versatile for creative content' },
    { id: 'manan', name: 'Manan', gender: 'male', category: 'Entertainment', description: 'Friendly and modern creative tone' },

    // Sales
    { id: 'tarun', name: 'Tarun', gender: 'male', category: 'Sales', description: 'Persuasive and confident sales expert', recommended: true },
    { id: 'sunny', name: 'Sunny', gender: 'male', category: 'Sales', description: 'High-energy and enthusiastic promoter' },
    { id: 'mani', name: 'Mani', gender: 'male', category: 'Sales', description: 'Professional and trustworthy advisor' },
    { id: 'ishita', name: 'Ishita', gender: 'female', category: 'Sales', description: 'Direct and convincing sales professional' },
    { id: 'aditya', name: 'Aditya', gender: 'male', category: 'Sales', description: 'Smooth and articulate corporate voice' },

    // News
    { id: 'gokul', name: 'Gokul', gender: 'male', category: 'News', description: 'Clear and authoritative news anchor tone', recommended: true },
    { id: 'vijay', name: 'Vijay', gender: 'male', category: 'News', description: 'Fast-paced and professional reporting style' },
    { id: 'shruti', name: 'Shruti', gender: 'female', category: 'News', description: 'Serious and articulate information delivery' },
    { id: 'kavitha', name: 'Kavitha', gender: 'female', category: 'News', description: 'Steady and rhythmic news narration' },
    { id: 'rehan', name: 'Rehan', gender: 'male', category: 'News', description: 'Contemporary news and bulletin style' },
    { id: 'soham', name: 'Soham', gender: 'male', category: 'News', description: 'Deep and formal announcement voice' },
    { id: 'rupali', name: 'Rupali', gender: 'female', category: 'News', description: 'Confident and clear broadcast voice' },
    { id: 'aayan', name: 'Aayan', gender: 'male', category: 'News', description: 'Versatile news and weather style' },
    { id: 'mohit', name: 'Mohit', gender: 'male', category: 'News', description: 'Traditional broadcast reporting voice' },
];

export const VOICE_CATEGORIES = ['Conversational', 'Audiobooks', 'Entertainment', 'Sales', 'News'] as const;
