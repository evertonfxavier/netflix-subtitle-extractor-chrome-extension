import { SubtitleSession, ExtractorState } from "./types";

const STORAGE_KEY = "netflix_subtitle_extractor";

/**
 * Salva o estado no chrome.storage.local
 */
export async function saveState(state: Partial<ExtractorState>): Promise<void> {
  const currentState = await loadState();
  const newState = { ...currentState, ...state };
  await chrome.storage.local.set({ [STORAGE_KEY]: newState });
}

/**
 * Carrega o estado do chrome.storage.local
 */
export async function loadState(): Promise<ExtractorState> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (
    result[STORAGE_KEY] || {
      isCapturing: false,
      currentSession: null,
      sessions: [],
    }
  );
}

/**
 * Salva uma sessão de legendas
 */
export async function saveSession(session: SubtitleSession): Promise<void> {
  const state = await loadState();
  const existingIndex = state.sessions.findIndex((s) => s.id === session.id);

  if (existingIndex >= 0) {
    state.sessions[existingIndex] = session;
  } else {
    state.sessions.push(session);
  }

  // Mantém apenas as últimas 20 sessões
  if (state.sessions.length > 20) {
    state.sessions = state.sessions.slice(-20);
  }

  await saveState({ sessions: state.sessions });
}

/**
 * Remove uma sessão
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const state = await loadState();
  state.sessions = state.sessions.filter((s) => s.id !== sessionId);
  await saveState({ sessions: state.sessions });
}

/**
 * Obtém todas as sessões
 */
export async function getSessions(): Promise<SubtitleSession[]> {
  const state = await loadState();
  return state.sessions;
}

/**
 * Limpa todas as sessões
 */
export async function clearAllSessions(): Promise<void> {
  await saveState({ sessions: [], currentSession: null });
}
