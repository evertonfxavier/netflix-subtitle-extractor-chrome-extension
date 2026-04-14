import {
  SubtitleEntry,
  SubtitleSession,
  ContentInfo,
  StatusMessage,
} from "../utils/types";
import { generateId, cleanSubtitleText } from "../utils/formatters";

/**
 * Netflix Subtitle Extractor - Content Script
 *
 * Este script é injetado nas páginas da Netflix e é responsável por:
 * 1. Detectar quando o usuário está assistindo conteúdo
 * 2. Observar e capturar legendas em tempo real
 * 3. Comunicar com o background script e popup
 */

class NetflixSubtitleExtractor {
  private isCapturing = false;
  private observer: MutationObserver | null = null;
  private currentSession: SubtitleSession | null = null;
  private lastSubtitleText = "";
  private subtitleCheckInterval: number | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // Estilos CSS para indicadores visuais
  private readonly STYLES = `
    .nse-capture-indicator {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      background: rgba(229, 9, 20, 0.9);
      color: white;
      font-family: "Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .nse-capture-indicator::before {
      content: "";
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      animation: nse-blink 1s infinite;
    }
    @keyframes nse-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .nse-live-panel {
      position: fixed;
      top: 50px;
      right: 10px;
      width: 350px;
      max-height: 400px;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid rgba(229, 9, 20, 0.5);
      border-radius: 8px;
      z-index: 999998;
      overflow: hidden;
      font-family: "Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .nse-live-header {
      padding: 10px 15px;
      background: rgba(229, 9, 20, 0.9);
      color: white;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nse-live-content {
      max-height: 340px;
      overflow-y: auto;
      padding: 10px;
    }
    .nse-live-content::-webkit-scrollbar {
      width: 6px;
    }
    .nse-live-content::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    .nse-live-content::-webkit-scrollbar-thumb {
      background: #e50914;
      border-radius: 3px;
    }
    .nse-subtitle-item {
      padding: 8px 10px;
      margin-bottom: 6px;
      background: rgba(40, 40, 40, 0.8);
      border-radius: 4px;
      border-left: 3px solid #e50914;
    }
    .nse-subtitle-time {
      font-size: 10px;
      color: #e50914;
      margin-bottom: 4px;
    }
    .nse-subtitle-text {
      font-size: 12px;
      color: #e5e5e5;
      line-height: 1.4;
    }
    .nse-subtitle-item.nse-latest {
      background: rgba(229, 9, 20, 0.2);
      border-left-color: #fff;
    }
    .nse-empty-message {
      text-align: center;
      color: #808080;
      font-size: 12px;
      padding: 20px;
    }
  `;

  // Seletores da Netflix (podem mudar com atualizações)
  private readonly SELECTORS = {
    // Container principal de legendas (classe mais comum)
    subtitleContainer: ".player-timedtext",
    // Alternativas de seletores
    subtitleContainerAlt: '[data-uia="player-timedtext"]',
    // Texto da legenda
    subtitleText: ".player-timedtext-text-container",
    // Spans dentro do container
    subtitleSpan: ".player-timedtext span",
    // Player de vídeo
    videoPlayer: "video",
    // Título do conteúdo
    titleElement: '[data-uia="video-title"]',
    // Informações do episódio
    episodeInfo: '[data-uia="video-title"] span',
  };

  constructor() {
    this.init();
  }

  /**
   * Inicializa o extrator
   */
  private init(): void {
    console.log("[Netflix Subtitle Extractor] Initializing...");

    // Injeta estilos CSS
    this.injectStyles();

    // Escuta mensagens do popup/background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Mantém o canal aberto para resposta assíncrona
    });

    // Observa mudanças na URL para detectar navegação
    this.observeUrlChanges();

    // Verifica periodicamente se estamos em uma página de reprodução
    this.checkForPlayer();

    console.log("[Netflix Subtitle Extractor] Ready!");
  }

  /**
   * Injeta estilos CSS na página
   */
  private injectStyles(): void {
    const styleElement = document.createElement("style");
    styleElement.id = "nse-styles";
    styleElement.textContent = this.STYLES;
    document.head.appendChild(styleElement);
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(
    message: { type: string; data?: unknown },
    sendResponse: (response: unknown) => void,
  ): void {
    switch (message.type) {
      case "START_CAPTURE":
        this.startCapture();
        sendResponse({ success: true });
        break;

      case "STOP_CAPTURE":
        this.stopCapture();
        sendResponse({
          success: true,
          session: this.currentSession,
        });
        break;

      case "GET_STATUS":
        sendResponse(this.getStatus());
        break;

      case "GET_CONTENT_INFO":
        sendResponse(this.getContentInfo());
        break;

      case "GET_CURRENT_SESSION":
        sendResponse({ session: this.currentSession });
        break;

      case "CLEAR_SESSION":
        this.clearCurrentSession();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }
  }

  /**
   * Retorna o status atual da captura
   */
  private getStatus(): StatusMessage {
    return {
      isCapturing: this.isCapturing,
      subtitleCount: this.currentSession?.entries.length || 0,
      currentTitle: this.currentSession?.title || null,
      contentInfo: this.getContentInfo(),
    };
  }

  /**
   * Obtém informações do conteúdo atual
   */
  private getContentInfo(): ContentInfo | null {
    const titleElement = document.querySelector(this.SELECTORS.titleElement);
    const subtitleContainer = this.findSubtitleContainer();
    const video = document.querySelector(
      this.SELECTORS.videoPlayer,
    ) as HTMLVideoElement;

    if (!video) return null;

    const titleParts = titleElement?.textContent?.split(":") || [];
    const mainTitle = titleParts[0]?.trim() || "Unknown";

    // Tenta extrair informações de série (temporada/episódio)
    let season: string | undefined;
    let episode: string | undefined;

    const episodeMatch = titleElement?.textContent?.match(
      /S(\d+):E(\d+)|(?:Season\s*(\d+).*Episode\s*(\d+))|(?:T(\d+):E(\d+))/i,
    );
    if (episodeMatch) {
      season = episodeMatch[1] || episodeMatch[3] || episodeMatch[5];
      episode = episodeMatch[2] || episodeMatch[4] || episodeMatch[6];
    }

    return {
      title: mainTitle,
      season,
      episode,
      isPlaying: !video.paused,
      hasSubtitles: !!subtitleContainer,
    };
  }

  /**
   * Encontra o container de legendas usando múltiplos seletores
   */
  private findSubtitleContainer(): Element | null {
    return (
      document.querySelector(this.SELECTORS.subtitleContainer) ||
      document.querySelector(this.SELECTORS.subtitleContainerAlt) ||
      document.querySelector(this.SELECTORS.subtitleText)
    );
  }

  /**
   * Inicia a captura de legendas
   */
  private startCapture(): void {
    if (this.isCapturing) {
      console.log("[Netflix Subtitle Extractor] Already capturing");
      return;
    }

    console.log("[Netflix Subtitle Extractor] Starting capture...");
    this.isCapturing = true;

    // Cria nova sessão
    const contentInfo = this.getContentInfo();
    this.currentSession = {
      id: generateId(),
      title: contentInfo?.title || "Unknown",
      season: contentInfo?.season,
      episode: contentInfo?.episode,
      language: this.detectLanguage(),
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Obtém referência ao vídeo
    this.videoElement = document.querySelector(
      this.SELECTORS.videoPlayer,
    ) as HTMLVideoElement;

    // Mostra painel de captura em tempo real
    this.showLivePanel();

    // Inicia observador de legendas
    this.startSubtitleObserver();

    // Também usa polling como fallback
    this.startSubtitlePolling();

    // Notifica o background
    chrome.runtime.sendMessage({
      type: "CAPTURE_STARTED",
      data: { session: this.currentSession },
    });
  }

  /**
   * Para a captura de legendas
   */
  private stopCapture(): void {
    if (!this.isCapturing) return;

    console.log("[Netflix Subtitle Extractor] Stopping capture...");
    this.isCapturing = false;

    // Remove painel de captura
    this.hideLivePanel();

    // Para o observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Para o polling
    if (this.subtitleCheckInterval) {
      clearInterval(this.subtitleCheckInterval);
      this.subtitleCheckInterval = null;
    }

    // Atualiza sessão
    if (this.currentSession) {
      this.currentSession.updatedAt = Date.now();

      // Salva sessão no storage
      chrome.runtime.sendMessage({
        type: "SAVE_SESSION",
        data: { session: this.currentSession },
      });
    }

    // Notifica o background
    chrome.runtime.sendMessage({
      type: "CAPTURE_STOPPED",
      data: { session: this.currentSession },
    });
  }

  /**
   * Inicia o MutationObserver para detectar mudanças nas legendas
   */
  private startSubtitleObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          this.checkAndCaptureSubtitle();
        }
      }
    });

    // Observa todo o documento para pegar quando o container aparecer
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Polling como método fallback para capturar legendas
   */
  private startSubtitlePolling(): void {
    this.subtitleCheckInterval = window.setInterval(() => {
      this.checkAndCaptureSubtitle();
    }, 100); // Verifica a cada 100ms
  }

  /**
   * Verifica e captura a legenda atual
   */
  private checkAndCaptureSubtitle(): void {
    if (!this.isCapturing || !this.currentSession) return;

    const container = this.findSubtitleContainer();
    if (!container) return;

    // Tenta múltiplas formas de extrair o texto
    let text = "";

    // Método 1: innerText direto
    text = container.textContent?.trim() || "";

    // Método 2: Se vazio, tenta buscar spans
    if (!text) {
      const spans = container.querySelectorAll("span");
      text = Array.from(spans)
        .map((span) => span.textContent)
        .join(" ")
        .trim();
    }

    // Método 3: innerHTML como fallback
    if (!text) {
      text = cleanSubtitleText(container.innerHTML);
    }

    // Se não há texto ou é igual ao último, ignora
    if (!text || text === this.lastSubtitleText) return;

    this.lastSubtitleText = text;

    // Obtém timestamp do vídeo
    const currentTime = this.videoElement
      ? Math.floor(this.videoElement.currentTime * 1000)
      : Date.now() - this.currentSession.createdAt;

    // Atualiza o tempo final da entrada anterior
    const lastEntry =
      this.currentSession.entries[this.currentSession.entries.length - 1];
    if (lastEntry && !lastEntry.endTime) {
      lastEntry.endTime = currentTime;
    }

    // Cria nova entrada
    const entry: SubtitleEntry = {
      index: this.currentSession.entries.length + 1,
      startTime: currentTime,
      endTime: 0, // Será preenchido quando a próxima legenda aparecer
      text: cleanSubtitleText(text),
    };

    this.currentSession.entries.push(entry);
    this.currentSession.updatedAt = Date.now();

    console.log(
      `[Netflix Subtitle Extractor] Captured: "${text.substring(0, 50)}..."`,
    );

    // Atualiza o painel em tempo real
    this.updateLivePanel(entry);

    // Notifica o popup sobre a nova legenda
    chrome.runtime.sendMessage({
      type: "SUBTITLE_CAPTURED",
      data: {
        entry,
        totalCount: this.currentSession.entries.length,
      },
    });
  }

  /**
   * Formata tempo em milissegundos para MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Mostra o painel de captura em tempo real
   */
  private showLivePanel(): void {
    // Remove painel existente se houver
    this.hideLivePanel();

    // Cria indicador de gravação
    const indicator = document.createElement("div");
    indicator.id = "nse-capture-indicator";
    indicator.className = "nse-capture-indicator";
    indicator.innerHTML = `<span>GRAVANDO</span>`;
    document.body.appendChild(indicator);

    // Cria painel
    const panel = document.createElement("div");
    panel.id = "nse-live-panel";
    panel.className = "nse-live-panel";
    panel.innerHTML = `
      <div class="nse-live-header">
        <span>📝 Legendas Capturadas</span>
        <span id="nse-count">0</span>
      </div>
      <div class="nse-live-content" id="nse-live-content">
        <div class="nse-empty-message">Aguardando legendas...</div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  /**
   * Esconde o painel de captura
   */
  private hideLivePanel(): void {
    document.getElementById("nse-capture-indicator")?.remove();
    document.getElementById("nse-live-panel")?.remove();
  }

  /**
   * Atualiza o painel com nova legenda
   */
  private updateLivePanel(entry: SubtitleEntry): void {
    const content = document.getElementById("nse-live-content");
    const countEl = document.getElementById("nse-count");

    if (!content || !this.currentSession) return;

    // Remove mensagem de vazio
    const emptyMsg = content.querySelector(".nse-empty-message");
    if (emptyMsg) emptyMsg.remove();

    // Remove classe latest do item anterior
    const prevLatest = content.querySelector(".nse-latest");
    if (prevLatest) prevLatest.classList.remove("nse-latest");

    // Cria novo item
    const item = document.createElement("div");
    item.className = "nse-subtitle-item nse-latest";
    item.innerHTML = `
      <div class="nse-subtitle-time">${this.formatTime(entry.startTime)} - #${entry.index}</div>
      <div class="nse-subtitle-text">${entry.text}</div>
    `;

    // Adiciona no topo
    content.insertBefore(item, content.firstChild);

    // Atualiza contador
    if (countEl) {
      countEl.textContent = this.currentSession.entries.length.toString();
    }

    // Limita a 50 itens no painel
    const items = content.querySelectorAll(".nse-subtitle-item");
    if (items.length > 50) {
      items[items.length - 1].remove();
    }
  }

  /**
   * Detecta o idioma das legendas
   */
  private detectLanguage(): string {
    // Tenta extrair do atributo lang do player
    const playerContainer = document.querySelector(".watch-video");
    const lang = playerContainer?.getAttribute("lang");

    // Tenta extrair do seletor de legendas
    const subtitleTrack = document.querySelector(
      '[data-uia="track-selector-subtitle"] .track-selector-item-selected',
    );
    const trackLang = subtitleTrack?.getAttribute("data-track-id");

    return trackLang || lang || "unknown";
  }

  /**
   * Observa mudanças de URL para detectar navegação
   */
  private observeUrlChanges(): void {
    let lastUrl = location.href;

    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("[Netflix Subtitle Extractor] URL changed:", lastUrl);

        // Para a captura se estava ativa
        if (this.isCapturing) {
          this.stopCapture();
        }

        // Verifica se está em página de reprodução
        this.checkForPlayer();
      }
    }).observe(document.body, { subtree: true, childList: true });
  }

  /**
   * Verifica se está em uma página de reprodução
   */
  private checkForPlayer(): void {
    const isWatchPage = /\/watch\//.test(location.href);

    if (isWatchPage) {
      console.log("[Netflix Subtitle Extractor] Watch page detected");
    }
  }

  /**
   * Limpa a sessão atual
   */
  private clearCurrentSession(): void {
    this.currentSession = null;
    this.lastSubtitleText = "";
  }
}

// Inicializa o extrator quando o script carrega
new NetflixSubtitleExtractor();
