export interface PresetImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
}

export interface BackgroundSuggestion {
  theme: string;
  prompt: string;
}

export interface AnalysisResult {
  subjectTitle: string;
  subjectDescription: string;
  backgroundSuggestions: BackgroundSuggestion[];
}

export type BgType = "transparent" | "solid" | "gradient" | "custom" | "ai";

export interface BgConfig {
  type: BgType;
  value: string; // Hex color, CSS gradient class, base64 data, or generated AI URL
}

export interface ProcessingProgress {
  status: "idle" | "loading_model" | "processing" | "analyzing" | "generating" | "failed";
  percent: number;
  message: string;
}
