export interface WakeWordPayload {
  keyword: string;
  detectedAt: number;
}

export interface AIResponsePayload {
  message: string;
  raw?: unknown;
  error?: string;
}

export interface PopupVisibilityPayload {
  visible: boolean;
  reason: "wakeword" | "error" | "response" | "timeout";
}

