import { StudentSnapshot, EdgeFunctionChatResponse, NudgeTone } from "../types";

export async function fetchLiveSnapshot(): Promise<StudentSnapshot> {
  const res = await fetch("/api/supabase/snapshot");
  if (!res.ok) {
    throw new Error(`Failed to fetch Supabase live snapshot: ${res.statusText}`);
  }
  return res.json();
}

export async function updateLiveSnapshot(patch: Partial<StudentSnapshot>): Promise<StudentSnapshot> {
  const res = await fetch("/api/supabase/snapshot", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Failed to update Supabase snapshot: ${res.statusText}`);
  }
  return res.json();
}

export async function sendChatMessageToEdgeFunction(params: {
  message: string;
  snapshot: StudentSnapshot;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  tone?: NudgeTone;
}): Promise<EdgeFunctionChatResponse> {
  const res = await fetch("/api/functions/nudge-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (res.status === 429) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Rate limit exceeded. Please wait ${errorData.retryAfter || 30} seconds.`
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.details || `Edge function failed (${res.status})`);
  }

  return res.json();
}

export async function fetchEdgeFunctionCode(): Promise<string> {
  const res = await fetch("/api/supabase/edge-function-code");
  if (!res.ok) {
    throw new Error("Failed to load edge function code");
  }
  const data = await res.json();
  return data.code;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const res = await fetch("/api/functions/transcribe-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || "audio/webm",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.details || "Audio transcription failed");
  }

  const data = await res.json();
  return data.transcript || "";
}

