import { SubtitleEntry } from "./types";

/**
 * Formata tempo em milissegundos para formato SRT (HH:MM:SS,mmm)
 */
export function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Formata tempo em milissegundos para formato VTT (HH:MM:SS.mmm)
 */
export function formatVTTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Converte entradas de legenda para formato SRT
 */
export function convertToSRT(entries: SubtitleEntry[]): string {
  return entries
    .map((entry, index) => {
      const startTime = formatSRTTime(entry.startTime);
      const endTime = formatSRTTime(entry.endTime);
      return `${index + 1}\n${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join("\n");
}

/**
 * Converte entradas de legenda para formato VTT
 */
export function convertToVTT(entries: SubtitleEntry[]): string {
  const header = "WEBVTT\n\n";
  const cues = entries
    .map((entry) => {
      const startTime = formatVTTTime(entry.startTime);
      const endTime = formatVTTTime(entry.endTime);
      return `${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join("\n");

  return header + cues;
}

/**
 * Converte entradas de legenda para texto simples
 */
export function convertToText(entries: SubtitleEntry[]): string {
  return entries.map((entry) => entry.text).join("\n");
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Limpa texto de legenda removendo tags HTML e espaços extras
 */
export function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove tags HTML
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

/**
 * Sanitiza nome de arquivo removendo caracteres inválidos
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}
