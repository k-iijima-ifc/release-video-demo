import { env } from "./env";

const BASE = "https://api.elevenlabs.io/v1";
/** 指定モデルでタイムスタンプ付き生成ができなかったときの代替 */
const FALLBACK_MODEL = "eleven_multilingual_v2";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type Speech = { audio: Buffer; seconds: number; alignment: Alignment; modelId: string };

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "xi-api-key": env("ELEVENLABS_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** ナレーションを生成する。字幕を音声に合わせるため、文字ごとのタイムスタンプも受け取る */
export async function textToSpeech(text: string, modelId = env("ELEVENLABS_MODEL_ID")): Promise<Speech> {
  const voiceId = env("ELEVENLABS_VOICE_ID");
  const res = await post(`/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    text,
    model_id: modelId,
  });
  if (!res.ok) {
    const detail = await res.text();
    if (modelId !== FALLBACK_MODEL && res.status >= 400 && res.status < 500) {
      console.warn(`  ${modelId} で生成できなかったため ${FALLBACK_MODEL} で再試行します: ${detail.slice(0, 200)}`);
      return textToSpeech(text, FALLBACK_MODEL);
    }
    throw new Error(`ElevenLabs TTS: HTTP ${res.status} ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { audio_base64: string; alignment: Alignment };
  const ends = data.alignment.character_end_times_seconds;
  return {
    audio: Buffer.from(data.audio_base64, "base64"),
    seconds: ends[ends.length - 1] ?? 0,
    alignment: data.alignment,
    modelId,
  };
}

/** 効果音を生成する */
export async function soundEffect(text: string, seconds: number): Promise<Buffer> {
  const res = await post("/sound-generation", { text, duration_seconds: seconds });
  if (!res.ok) throw new Error(`ElevenLabs sound effect: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}
