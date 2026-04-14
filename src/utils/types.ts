/**
 * Tipos para a extensão de extração de legendas da Netflix
 */

export interface SubtitleEntry {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleSession {
  id: string;
  title: string;
  season?: string;
  episode?: string;
  language: string;
  entries: SubtitleEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface ExtractorState {
  isCapturing: boolean;
  currentSession: SubtitleSession | null;
  sessions: SubtitleSession[];
}

export interface MessagePayload {
  type: MessageType;
  data?: unknown;
}

export type MessageType =
  | "START_CAPTURE"
  | "STOP_CAPTURE"
  | "GET_STATUS"
  | "STATUS_UPDATE"
  | "SUBTITLE_CAPTURED"
  | "DOWNLOAD_SUBTITLES"
  | "CLEAR_SESSION"
  | "GET_SESSIONS"
  | "SESSIONS_LIST"
  | "CONTENT_INFO";

export interface ContentInfo {
  title: string;
  season?: string;
  episode?: string;
  isPlaying: boolean;
  hasSubtitles: boolean;
}

export interface StatusMessage {
  isCapturing: boolean;
  subtitleCount: number;
  currentTitle: string | null;
  contentInfo: ContentInfo | null;
}
