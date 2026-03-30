export const SARVAM_LANGUAGES = [
  { code: "en-IN", name: "English (India)", nativeName: "English", voiceFemale: "Meera (F)", voiceMale: "Arjun (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", voiceFemale: "Ananya (F)", voiceMale: "Arjun (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", voiceFemale: "Mousumi (F)", voiceMale: "Amartya (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", voiceFemale: "Priya (F)", voiceMale: "Karan (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", voiceFemale: "Sravanthi (F)", voiceMale: "Raghu (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", voiceFemale: "Sneha (F)", voiceMale: "Rohan (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", voiceFemale: "Aarti (F)", voiceMale: "Jay (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", voiceFemale: "Deepa (F)", voiceMale: "Prakash (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", voiceFemale: "Meera (F)", voiceMale: "Suresh (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", voiceFemale: "Harpreet (F)", voiceMale: "Gurpreet (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", voiceFemale: "Laxmi (F)", voiceMale: "Saroj (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া", voiceFemale: "Priyanka (F)", voiceMale: "Bhaskar (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "ur-IN", name: "Urdu", nativeName: "اردو", voiceFemale: "Farah (F)", voiceMale: "Imran (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "ne-IN", name: "Nepali", nativeName: "नेपाली", voiceFemale: "Sita (F)", voiceMale: "Ramesh (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "sa-IN", name: "Sanskrit", nativeName: "संस्कृतम्", voiceFemale: "Devika (F)", voiceMale: "Vishnu (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "sd-IN", name: "Sindhi", nativeName: "सिन्धी", voiceFemale: "Aisha (F)", voiceMale: "Ravi (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "ks-IN", name: "Kashmiri", nativeName: "कॉशुर", voiceFemale: "Nusrat (F)", voiceMale: "Farooq (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "mni-IN", name: "Manipuri", nativeName: "মৈতৈলোন্", voiceFemale: "Leima (F)", voiceMale: "Nongpok (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "doi-IN", name: "Dogri", nativeName: "डोगरी", voiceFemale: "Kamla (F)", voiceMale: "Surinder (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "mai-IN", name: "Maithili", nativeName: "मैथिली", voiceFemale: "Suman (F)", voiceMale: "Kumar (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "sat-IN", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", voiceFemale: "Lalita (F)", voiceMale: "Sobha (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
  { code: "brx-IN", name: "Bodo", nativeName: "बर'", voiceFemale: "Anita (F)", voiceMale: "Bijoy (M)", ttsModel: "sarvam-1", sttModel: "sarvam-1", supported: true },
];

export async function detectLanguage(text: string): Promise<string> {
  try {
    // If we have a SarvamClient method
    // const { sarvamClient } = await import('../services/SarvamClient');
    // const langInfo = await sarvamClient.identifyLanguage(text);
    // return langInfo.language || 'en-IN';
    
    // For now we assume a basic check, real logic depends on Sarvam API wrapper
    return "en-IN";
  } catch (err) {
    console.error('Failed to detect language:', err);
    return 'en-IN';
  }
}

export function getSupportedLanguages() {
  return SARVAM_LANGUAGES;
}
