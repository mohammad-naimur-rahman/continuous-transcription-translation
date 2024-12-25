export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
}

export interface RecordingState {
  isRecording: boolean;
  audioBlob: Blob | null;
  isProcessing: boolean;
  error: string | null;
  translation: TranslationResult | null;
}