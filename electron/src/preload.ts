import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { AIResponsePayload, PopupVisibilityPayload, WakeWordPayload } from "./types/events";

type Listener<T> = (payload: T) => void;

const subscribe = <T>(channel: string, listener: Listener<T>) => {
  const handler = (_event: IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

const electronAPI = {
  onWakeWord: (listener: Listener<WakeWordPayload>) => subscribe("wake-word", listener),
  onAIResponse: (listener: Listener<AIResponsePayload>) => subscribe("ai:response", listener),
  onPopupVisibility: (listener: Listener<PopupVisibilityPayload>) => subscribe("popup:visibility", listener)
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

