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

export type ElectronListener<TPayload> = (payload: TPayload) => void;
export type ElectronUnsubscribe = () => void;

export interface ElectronAPI {
  onWakeWord: (listener: ElectronListener<WakeWordPayload>) => ElectronUnsubscribe;
  onAIResponse: (listener: ElectronListener<AIResponsePayload>) => ElectronUnsubscribe;
  onPopupVisibility: (listener: ElectronListener<PopupVisibilityPayload>) => ElectronUnsubscribe;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

