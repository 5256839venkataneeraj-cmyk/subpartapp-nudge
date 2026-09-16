import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Server,
  Smartphone,
  Cpu,
  ArrowRight,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Sparkles,
  Terminal,
  FileText
} from "lucide-react";
import { fetchEdgeFunctionCode } from "../lib/api";

interface SecurityExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityExplainerModal: React.FC<SecurityExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "why_proxy" | "four_step_flow" | "local_vault" | "edge_code"
  >("why_proxy");
  const [edgeCode, setEdgeCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !edgeCode) {
      fetchEdgeFunctionCode()
        .then(setEdgeCode)
        .catch((err) => console.error("Failed to load edge code:", err));
    }
  }, [isOpen, edgeCode]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(edgeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <span>Teach as You Build: Security Architecture</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  Production Grade
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Understanding why the Edge Function proxy is non-negotiable in personal projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-800 bg-stone-950/70 px-4 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab("why_proxy")}
            className={`py-3 px-4 font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "why_proxy"
                ? "border-amber-500 text-amber-400 bg-stone-900/40"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>1. Why Client Keys Fail</span>
          </button>
          <button
            onClick={() => setActiveTab("four_step_flow")}
            className={`py-3 px-4 font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "four_step_flow"
                ? "border-amber-500 text-amber-400 bg-stone-900/40"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. The 4-Step Secure Flow</span>
          </button>
          <button
            onClick={() => setActiveTab("local_vault")}
            className={`py-3 px-4 font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "local_vault"
                ? "border-amber-500 text-amber-400 bg-stone-900/40"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>3. On-Device Chat Vault</span>
          </button>
          <button
            onClick={() => setActiveTab("edge_code")}
            className={`py-3 px-4 font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "edge_code"
                ? "border-amber-500 text-amber-400 bg-stone-900/40"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>4. Edge Function Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm space-y-6">
          {/* TAB 1: WHY CLIENT KEYS FAIL */}
          {activeTab === "why_proxy" && (
            <div className="space-y-6">
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 text-stone-200">
                <h3 className="font-semibold text-rose-300 flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  The Fatal Mistake: Putting API Keys in Mobile/Web Apps
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Most beginner and intermediate developers think putting an API key in an{" "}
                  <code className="bg-stone-900 px-1 py-0.5 rounded text-rose-300">.env</code> file
                  or compile-time Flutter constant protects it. In reality, any compiled app shipped to a user's device can be decompiled in seconds.
                </p>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flawed Way */}
                <div className="bg-stone-950/70 border border-rose-900/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                    <span>❌ The Dangerous Pattern (Direct Client Call)</span>
                    <span className="px-1.5 py-0.5 bg-rose-950 rounded text-[10px]">Trivial to Hack</span>
                  </div>
                  <div className="bg-stone-900 p-2.5 rounded-lg font-mono text-[11px] text-rose-300/90 border border-rose-950 space-y-1">
                    <div>// INSIDE FLUTTER / REACT CODE:</div>
                    <div>const apiKey = "AIzaSyD7..."; // ❌ HARDCODED</div>
                    <div>fetch("https://...googleapis.com/...", &#123;</div>
                    <div className="pl-4">headers: &#123; "x-goog-api-key": apiKey &#125;</div>
                    <div>&#125;);</div>
                  </div>
                  <ul className="text-xs text-stone-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        <strong>Decompilation (JADX / strings):</strong> Anyone running{" "}
                        <code className="bg-stone-900 px-1 rounded text-stone-300 font-mono">strings app.apk | grep AIza</code> pulls your key instantly.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        <strong>Network Sniffing:</strong> Proxies like Charles or Mitmproxy capture outgoing HTTP requests and steal your key.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        <strong>Billing Hijack:</strong> Malicious actors scrape your quota for their own bots, draining your wallet.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Secure Way */}
                <div className="bg-stone-950/70 border border-emerald-900/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span>✅ The Secure Pattern (Supabase Edge Proxy)</span>
                    <span className="px-1.5 py-0.5 bg-emerald-950 rounded text-[10px]">Production Grade</span>
                  </div>
                  <div className="bg-stone-900 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300/90 border border-emerald-950 space-y-1">
                    <div>// APP CALLS EDGE FUNCTION ONLY:</div>
                    <div>await fetch("/functions/v1/nudge-chat", &#123;</div>
                    <div className="pl-4">body: JSON.stringify(&#123; message, snapshot &#125;)</div>
                    <div>&#125;);</div>
                    <div className="text-stone-500">// Gemini key is isolated in Supabase Secrets!</div>
                  </div>
                  <ul className="text-xs text-stone-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>Zero Key Exposure:</strong> The Gemini API key never travels to the device. It lives as a server-side environment secret.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>System Prompt Lockdown:</strong> The client cannot alter the model's instructions or inject rogue prompts.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>Built-in Rate Limiting:</strong> Enforces token buckets / IP limits so your endpoint cannot be abused.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Single Model Config Note */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-2">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Single Model Config Rule
                </div>
                <p>
                  Notice how <code className="text-amber-300 font-mono">"gemini-3.8-flash"</code> is declared once as a single configuration constant (<code className="text-amber-300 font-mono">export const GEMINI_MODEL = "gemini-3.8-flash"</code>) with automatic multi-tier fallback (<code className="text-stone-300 font-mono">gemini-flash-latest</code>, <code className="text-stone-300 font-mono">gemini-3.1-flash-lite</code>) and transient 503 exponential backoff. It is never sprinkled across components. If Google releases a new model, you change exactly one line of server config.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: THE 4-STEP SECURE FLOW */}
          {activeTab === "four_step_flow" && (
            <div className="space-y-5">
              <p className="text-xs text-stone-300">
                Here is the exact runtime lifecycle executed on every single message Alex sends to Nudge:
              </p>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-100">
                        App pulls Live Supabase Snapshot & Chat Turns
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">Client Side</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Before firing the HTTP request, Nudge queries the database for today's classes, open assignments, habit logs, current streak, and mood. It packages this snapshot with the last 6 turns of conversation.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-100">
                        Supabase Edge Function Interception & Rate Limiting
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        Edge / Server
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      The Edge Function checks the caller's IP against an in-memory token bucket (20 req/min). If allowed, it extracts <code className="text-amber-300 font-mono">Deno.env.get("GEMINI_API_KEY")</code> from encrypted Supabase Vault secrets.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-100">
                        Gemini Call with Injected System Instructions
                      </span>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                        @google/genai SDK
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      The Edge Function builds the Nudge system prompt, attaches the calendar scheduling syntax rules (<code className="text-stone-300 font-mono">[EVENT: Title | Date | Time | Notes]</code>), and dispatches to <code className="text-amber-300 font-mono">gemini-3.8-flash</code> (with high-availability fallback).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-stone-100">
                        Payload Sanitization, Event Parsing & Client Return
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">Response Sanitizer</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      The Edge Function parses out any <code className="text-stone-300 font-mono">[EVENT]</code> tags into clean JSON objects, removes them from the spoken dialogue, and returns ONLY <code className="text-emerald-300 font-mono">&#123; reply, events &#125;</code>. The client app never sees the API key or raw headers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ON-DEVICE CHAT VAULT */}
          {activeTab === "local_vault" && (
            <div className="space-y-5">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 text-stone-200 space-y-2">
                <h3 className="font-semibold text-emerald-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Privacy Architecture: Cloud Database vs. Local Vault
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  In Nudge, we deliberately split our storage model into two separate domains to respect user privacy and performance:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <Server className="w-4 h-4" />
                    <span>Supabase Cloud Database</span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Stores objective, non-confidential student facts:
                  </div>
                  <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                    <li>Class schedules and classroom numbers</li>
                    <li>Assignment titles and due dates</li>
                    <li>Daily habit checkboxes</li>
                    <li>Study streak counts</li>
                  </ul>
                  <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
                    Needs multi-device sync and notifications.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>On-Device Storage (SQLite / Hive / Local)</span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Stores personal, emotional chat history:
                  </div>
                  <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                    <li>Student reflections and anxiety vents</li>
                    <li>Conversation transcripts with Nudge</li>
                    <li>Advice and personalized pep talks</li>
                  </ul>
                  <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
                    Kept 100% on the physical phone/browser. Zero cloud telemetry.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 space-y-1">
                <div className="font-semibold text-stone-100">History Pagination & Capping</div>
                <p className="text-stone-400">
                  Because chat histories can grow to hundreds of turns over a semester, Nudge loads messages in paginated slices (default 15 at a time) rather than parsing thousands of records on launch.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: EDGE FUNCTION CODE */}
          {activeTab === "edge_code" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs text-stone-300">
                    supabase/functions/nudge-chat/index.ts
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 font-mono flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 overflow-x-auto max-h-96">
                <pre className="font-mono text-xs text-stone-300 leading-relaxed whitespace-pre">
                  {edgeCode || "// Loading Supabase Edge Function code..."}
                </pre>
              </div>

              <div className="text-xs text-stone-400 p-3 rounded-lg bg-stone-950 border border-stone-800">
                💡 <strong>Deploy to Supabase CLI:</strong> Run{" "}
                <code className="bg-stone-900 text-amber-300 px-1 py-0.5 rounded font-mono">
                  supabase secrets set GEMINI_API_KEY="your-key"
                </code>{" "}
                followed by{" "}
                <code className="bg-stone-900 text-amber-300 px-1 py-0.5 rounded font-mono">
                  supabase functions deploy nudge-chat --no-verify-jwt
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>Security checklist verified for Nudge AI companion</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            Got it, back to chat
          </button>
        </div>
      </div>
    </div>
  );
};
