import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_TYPES = new Set([
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/m4a",
  "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/flac",
  "video/mp4", "video/webm", "video/quicktime",
]);
const allowedExtension = /\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|ogg|oga|flac)$/i;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      throw new FormServiceError("Origem não autorizada.", 403);
    }
    await authorizedForms();

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 3.75 * 1024 * 1024) {
      throw new FormServiceError("O áudio deve ter até 3,5 MB. Divida arquivos longos em partes.", 413);
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new FormServiceError("Selecione um áudio ou grave sua mensagem.");
    }
    if (file.size === 0 || file.size > 3.5 * 1024 * 1024) {
      throw new FormServiceError("O áudio deve ter até 3,5 MB.", 413);
    }
    const name = file.name || "gravacao.webm";
    if (!allowedExtension.test(name) ||
        (file.type && !SUPPORTED_TYPES.has(file.type.split(";")[0].toLowerCase()))) {
      throw new FormServiceError("Formato de áudio não suportado. Use MP3, M4A, WAV, OGG ou WebM.");
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new FormServiceError("Transcrição de áudio não configurada.", 503);

    const transcription = new FormData();
    transcription.append("file", file, name);
    transcription.append("model", process.env.PAGENOVA_EBOOK_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe");
    transcription.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey },
      body: transcription,
      signal: AbortSignal.timeout(50_000),
    });
    const result = await response.json().catch(() => ({})) as {
      text?: string; error?: { message?: string };
    };
    if (!response.ok) {
      throw new FormServiceError("Não foi possível transcrever o áudio. " +
        (result.error?.message || "Tente outro arquivo."), 502);
    }
    const text = typeof result.text === "string" ? result.text.trim() : "";
    if (!text) throw new FormServiceError("O áudio não contém fala reconhecível.", 422);
    return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorsAsResponse(error);
  }
}
