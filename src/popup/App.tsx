import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  Download,
  Trash2,
  Film,
  Subtitles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Clock,
  Tv,
} from "lucide-react";
import { StatusMessage, SubtitleSession } from "../utils/types";

type DownloadFormat = "srt" | "vtt" | "txt";

interface SessionListProps {
  sessions: SubtitleSession[];
  onDownload: (session: SubtitleSession, format: DownloadFormat) => void;
  onDelete: (sessionId: string) => void;
}

/**
 * Componente de lista de sessões salvas
 */
function SessionList({ sessions, onDownload, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma legenda salva ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-netflix-dark rounded-lg p-3 border border-gray-800"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {session.title}
              </h4>
              {session.season && session.episode && (
                <p className="text-xs text-gray-500">
                  Temp. {session.season} Ep. {session.episode}
                </p>
              )}
            </div>
            <button
              onClick={() => onDelete(session.id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Subtitles className="w-3 h-3" />
              {session.entries.length} legendas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(session.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onDownload(session, "srt")}
              className="flex-1 px-2 py-1.5 bg-netflix-red/20 hover:bg-netflix-red/30 text-netflix-red rounded text-xs font-medium transition-colors"
            >
              SRT
            </button>
            <button
              onClick={() => onDownload(session, "vtt")}
              className="flex-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors"
            >
              VTT
            </button>
            <button
              onClick={() => onDownload(session, "txt")}
              className="flex-1 px-2 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded text-xs font-medium transition-colors"
            >
              TXT
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Componente principal do popup
 */
export default function App() {
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [sessions, setSessions] = useState<SubtitleSession[]>([]);
  const [isOnNetflix, setIsOnNetflix] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"capture" | "history">("capture");

  /**
   * Verifica se a aba atual é Netflix e obtém status
   */
  const checkCurrentTab = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Verifica se está em uma página de watch da Netflix
      const isWatchPage = tab.url?.match(/netflix\.com\/watch\//);

      if (!isWatchPage) {
        setIsOnNetflix(false);
        setIsLoading(false);
        return;
      }

      setIsOnNetflix(true);

      // Obtém status do content script
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_STATUS" },
          (response: StatusMessage) => {
            if (chrome.runtime.lastError) {
              console.log("Content script not ready");
              setStatus(null);
            } else {
              setStatus(response);
            }
            setIsLoading(false);
          },
        );
      }
    } catch (err) {
      console.error("Error checking tab:", err);
      setError("Erro ao verificar aba atual");
      setIsLoading(false);
    }
  }, []);

  /**
   * Carrega sessões salvas
   */
  const loadSessions = useCallback(async () => {
    try {
      chrome.runtime.sendMessage(
        { type: "GET_SESSIONS" },
        (response: { sessions: SubtitleSession[] }) => {
          if (response?.sessions) {
            setSessions(response.sessions.reverse());
          }
        },
      );
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  }, []);

  useEffect(() => {
    checkCurrentTab();
    loadSessions();

    // Atualiza periodicamente enquanto o popup está aberto
    const interval = setInterval(() => {
      if (activeTab === "capture") {
        checkCurrentTab();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [checkCurrentTab, loadSessions, activeTab]);

  /**
   * Inicia a captura de legendas
   */
  const startCapture = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "START_CAPTURE" },
          (response) => {
            if (response?.success) {
              checkCurrentTab();
            }
          },
        );
      }
    } catch (err) {
      setError("Erro ao iniciar captura");
    }
  };

  /**
   * Para a captura de legendas
   */
  const stopCapture = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "STOP_CAPTURE" }, () => {
          checkCurrentTab();
          loadSessions();
        });
      }
    } catch (err) {
      setError("Erro ao parar captura");
    }
  };

  /**
   * Faz download de uma sessão
   */
  const handleDownload = (session: SubtitleSession, format: DownloadFormat) => {
    console.log(
      "Downloading session:",
      session.title,
      "with",
      session.entries.length,
      "entries",
    );
    chrome.runtime.sendMessage({
      type: "DOWNLOAD_SUBTITLES",
      data: { session, format },
    });
  };

  /**
   * Faz download da sessão atual (durante captura)
   */
  const downloadCurrentSession = async (format: DownloadFormat) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_CURRENT_SESSION" },
          (response: { session: SubtitleSession | null }) => {
            if (response?.session && response.session.entries.length > 0) {
              handleDownload(response.session, format);
            } else {
              setError("Nenhuma legenda capturada ainda");
              setTimeout(() => setError(null), 3000);
            }
          },
        );
      }
    } catch (err) {
      setError("Erro ao obter sessão atual");
    }
  };

  /**
   * Exclui uma sessão
   */
  const handleDelete = (sessionId: string) => {
    chrome.runtime.sendMessage(
      {
        type: "DELETE_SESSION",
        data: { sessionId },
      },
      () => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      },
    );
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-netflix-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-netflix-red to-red-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Film className="w-6 h-6 text-white" />
          <div>
            <h1 className="text-lg font-bold text-white">
              Netflix Subtitle Extractor
            </h1>
            <p className="text-xs text-white/70">
              Extraia legendas em tempo real
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("capture")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "capture"
              ? "text-netflix-red border-b-2 border-netflix-red"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Captura
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            loadSessions();
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "history"
              ? "text-netflix-red border-b-2 border-netflix-red"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Histórico
          {sessions.length > 0 && (
            <span className="absolute top-1 right-6 bg-netflix-red text-white text-xs rounded-full px-1.5">
              {sessions.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {activeTab === "capture" ? (
          <>
            {/* Netflix status */}
            {!isOnNetflix ? (
              <div className="text-center py-8">
                <Tv className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-300 mb-2">
                  Reproduza algo na Netflix
                </h2>
                <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                  Acesse netflix.com/watch/... e comece a assistir um filme ou
                  série para extrair as legendas
                </p>
              </div>
            ) : (
              <>
                {/* Content info */}
                {status?.contentInfo && (
                  <div className="mb-4 p-3 bg-netflix-dark rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-netflix-red" />
                      <span className="text-sm font-medium text-white">
                        {status.contentInfo.title}
                      </span>
                    </div>
                    {status.contentInfo.season &&
                      status.contentInfo.episode && (
                        <p className="text-xs text-gray-500 ml-6">
                          Temporada {status.contentInfo.season}, Episódio{" "}
                          {status.contentInfo.episode}
                        </p>
                      )}
                    <div className="flex items-center gap-3 mt-2 ml-6 text-xs">
                      <span
                        className={`flex items-center gap-1 ${status.contentInfo.isPlaying ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {status.contentInfo.isPlaying ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {status.contentInfo.isPlaying
                          ? "Reproduzindo"
                          : "Pausado"}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${status.contentInfo.hasSubtitles ? "text-green-400" : "text-yellow-400"}`}
                      >
                        <Subtitles className="w-3 h-3" />
                        {status.contentInfo.hasSubtitles
                          ? "Legendas ativas"
                          : "Sem legendas"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Capture status */}
                {status?.isCapturing && (
                  <div className="mb-4 p-3 bg-netflix-red/10 border border-netflix-red/30 rounded-lg">
                    <div className="flex items-center gap-2 text-netflix-red mb-1">
                      <span className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        Capturando legendas...
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {status.subtitleCount}{" "}
                      <span className="text-sm font-normal text-gray-400">
                        legendas capturadas
                      </span>
                    </p>
                  </div>
                )}

                {/* Warning if no subtitles */}
                {isOnNetflix &&
                  status?.contentInfo &&
                  !status.contentInfo.hasSubtitles && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-yellow-500 font-medium">
                          Legendas não detectadas
                        </p>
                        <p className="text-yellow-500/70 text-xs mt-1">
                          Ative as legendas no player da Netflix para
                          capturá-las
                        </p>
                      </div>
                    </div>
                  )}

                {/* Action buttons */}
                <div className="space-y-2">
                  {!status?.isCapturing ? (
                    <button
                      onClick={startCapture}
                      disabled={!status?.contentInfo?.hasSubtitles}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-netflix-red hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Captura
                    </button>
                  ) : (
                    <button
                      onClick={stopCapture}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      <Square className="w-5 h-5" />
                      Parar e Salvar
                    </button>
                  )}

                  {status?.isCapturing && status.subtitleCount > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => downloadCurrentSession("srt")}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-netflix-dark hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        SRT
                      </button>
                      <button
                        onClick={() => downloadCurrentSession("vtt")}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-netflix-dark hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        VTT
                      </button>
                      <button
                        onClick={() => downloadCurrentSession("txt")}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-netflix-dark hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        TXT
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {!status?.isCapturing && (
                  <div className="mt-6 text-xs text-gray-500 space-y-2">
                    <p className="font-medium text-gray-400">Como usar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Reproduza um filme ou série na Netflix</li>
                      <li>Ative as legendas no idioma desejado</li>
                      <li>Clique em "Iniciar Captura"</li>
                      <li>
                        Assista ao conteúdo (legendas serão capturadas em tempo
                        real)
                      </li>
                      <li>Clique em "Parar e Salvar" quando terminar</li>
                    </ol>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* History tab */
          <SessionList
            sessions={sessions}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 border-t border-gray-800 text-center text-xs text-gray-600">
        Use com responsabilidade. Respeite os direitos autorais.
      </footer>
    </div>
  );
}
