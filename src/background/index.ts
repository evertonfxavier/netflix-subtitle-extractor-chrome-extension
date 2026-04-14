import { SubtitleSession } from "../utils/types";
import {
  convertToSRT,
  convertToVTT,
  sanitizeFilename,
} from "../utils/formatters";
import {
  saveSession,
  getSessions,
  deleteSession,
  clearAllSessions,
} from "../utils/storage";

/**
 * Netflix Subtitle Extractor - Background Service Worker
 *
 * Responsável por:
 * 1. Gerenciar o estado global da extensão
 * 2. Salvar sessões de legendas
 * 3. Processar downloads de arquivos de legendas
 * 4. Comunicar entre content scripts e popup
 */

console.log("[Netflix Subtitle Extractor] Background service worker started");

// Estado em memória
let activeTabId: number | null = null;

// Escuta mensagens de content scripts e popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Mantém o canal aberto para resposta assíncrona
});

/**
 * Processa mensagens recebidas
 */
async function handleMessage(
  message: { type: string; data?: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  console.log("[Background] Message received:", message.type);

  try {
    switch (message.type) {
      case "CAPTURE_STARTED":
        activeTabId = sender.tab?.id || null;
        updateBadge("REC", "#E50914");
        sendResponse({ success: true });
        break;

      case "CAPTURE_STOPPED":
        activeTabId = null;
        updateBadge("", "");
        sendResponse({ success: true });
        break;

      case "SAVE_SESSION":
        const sessionToSave = message.data as { session: SubtitleSession };
        await saveSession(sessionToSave.session);
        sendResponse({ success: true });
        break;

      case "GET_SESSIONS":
        const sessions = await getSessions();
        sendResponse({ sessions });
        break;

      case "DELETE_SESSION":
        const { sessionId } = message.data as { sessionId: string };
        await deleteSession(sessionId);
        sendResponse({ success: true });
        break;

      case "CLEAR_ALL_SESSIONS":
        await clearAllSessions();
        sendResponse({ success: true });
        break;

      case "DOWNLOAD_SUBTITLES":
        const downloadData = message.data as {
          session: SubtitleSession;
          format: "srt" | "vtt" | "txt";
        };
        await downloadSubtitles(downloadData.session, downloadData.format);
        sendResponse({ success: true });
        break;

      case "SUBTITLE_CAPTURED":
        // Atualiza o badge com contador
        const captureData = message.data as { totalCount: number };
        updateBadge(captureData.totalCount.toString(), "#E50914");
        sendResponse({ success: true });
        break;

      case "GET_ACTIVE_TAB":
        sendResponse({ tabId: activeTabId });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }
  } catch (error) {
    console.error("[Background] Error handling message:", error);
    sendResponse({ error: String(error) });
  }
}

/**
 * Atualiza o badge da extensão
 */
function updateBadge(text: string, color: string): void {
  chrome.action.setBadgeText({ text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

/**
 * Faz download das legendas no formato especificado
 */
async function downloadSubtitles(
  session: SubtitleSession,
  format: "srt" | "vtt" | "txt",
): Promise<void> {
  let content: string;
  let extension: string;

  // Verifica se há legendas
  if (!session.entries || session.entries.length === 0) {
    console.error("[Background] No subtitles to download");
    throw new Error("No subtitles to download");
  }

  // Finaliza timestamps de entradas sem endTime
  const entries = session.entries.map((entry, index, arr) => ({
    ...entry,
    endTime:
      entry.endTime || arr[index + 1]?.startTime || entry.startTime + 3000, // 3 segundos default
  }));

  const processedSession = { ...session, entries };

  switch (format) {
    case "srt":
      content = convertToSRT(processedSession.entries);
      extension = "srt";
      break;

    case "vtt":
      content = convertToVTT(processedSession.entries);
      extension = "vtt";
      break;

    case "txt":
      content = processedSession.entries.map((e) => e.text).join("\n\n");
      extension = "txt";
      break;

    default:
      throw new Error(`Unknown format: ${format}`);
  }

  // Cria nome do arquivo
  let filename = sanitizeFilename(session.title);
  if (session.season && session.episode) {
    filename += `_S${session.season.padStart(2, "0")}E${session.episode.padStart(2, "0")}`;
  }
  filename += `.${extension}`;

  console.log(
    "[Background] Downloading:",
    filename,
    "with",
    entries.length,
    "entries",
  );

  // Usa data URL em vez de blob URL (funciona melhor em service workers)
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/plain;base64,${base64Content}`;

  // Faz download
  try {
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: true,
    });
    console.log("[Background] Download started with ID:", downloadId);
  } catch (error) {
    console.error("[Background] Download error:", error);
    throw error;
  }
}

// Monitora quando uma aba é fechada para limpar estado
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null;
    updateBadge("", "");
  }
});

// Monitora navegação para detectar saída da Netflix
chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    if (!changeInfo.url.includes("netflix.com")) {
      activeTabId = null;
      updateBadge("", "");
    }
  }
});
