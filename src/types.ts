export interface PresetImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
}

export type BgType = "transparent" | "solid" | "gradient" | "custom";

export interface BgConfig {
  type: BgType;
  value: string; // Hex color, CSS gradient class, or base64 data
}

export interface ProcessingProgress {
  status: "idle" | "loading_model" | "processing" | "failed";
  percent: number;
  message: string;
}
