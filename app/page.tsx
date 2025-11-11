"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PromptPresets } from "@/components/prompt-presets";
import { VideoPreview } from "@/components/video-preview";

interface GenerateResponse {
  operationName: string;
  done: boolean;
  videoUris?: string[];
  throttleSeconds?: number;
  error?: string;
}

const ASPECT_OPTIONS = [
  { value: "16:9", label: "16:9 — Widescreen" },
  { value: "21:9", label: "21:9 — Ultrawide" },
  { value: "9:16", label: "9:16 — Vertical" },
  { value: "1:1", label: "1:1 — Square" }
];

const CAMERA_STYLES = [
  { value: "cinematic-dolly", label: "Cinematic Dolly" },
  { value: "drone-aerial", label: "Aerial Drone" },
  { value: "steadicam-tracking", label: "Steadicam Tracking" },
  { value: "handheld-documentary", label: "Handheld Documentary" },
  { value: "virtual-crane", label: "Virtual Crane" }
];

const VISUAL_STYLES = [
  { value: "hollywood-epic", label: "Hollywood Epic" },
  { value: "neo-noir", label: "Neo Noir" },
  { value: "natural-cine", label: "Natural Cine" },
  { value: "hyper-real", label: "Hyper Real" },
  { value: "dreamlike", label: "Dreamlike" }
];

const FPS_OPTIONS = [24, 30, 60, 120];

function bytesFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? result;
        resolve(base64);
      } else {
        reject(new Error("Unsupported file result"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("12");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [cameraStyle, setCameraStyle] = useState("cinematic-dolly");
  const [visualStyle, setVisualStyle] = useState("hollywood-epic");
  const [fps, setFps] = useState(24);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Awaiting prompt");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const pollAttemptsRef = useRef(0);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cinematicTagline = useMemo(() => {
    if (!prompt) return "Craft your cinematic prompt to summon Veo.";
    if (prompt.length < 120) return "Add descriptive camera cues, lighting, atmosphere and pacing.";
    return "Looks cinematic already. Ready when you are.";
  }, [prompt]);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const pollOperation = async (name: string, delaySeconds = 5) => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    pollTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/generate-video/status?operation=${encodeURIComponent(name)}`);
        const json = (await response.json()) as GenerateResponse;

        if (!response.ok || json.error) {
          throw new Error(json.error ?? "Failed to poll Veo status");
        }

        setStatusMessage("Rendering sequence in Veo cloud...");
        setPollAttempts((attempts) => {
          const next = attempts + 1;
          pollAttemptsRef.current = next;
          return next;
        });

        if (json.done && json.videoUris && json.videoUris.length > 0) {
          setVideoUrl(json.videoUris[0] ?? null);
          setIsGenerating(false);
          setStatusMessage("Completed — download ready.");
          toast.success("Veo render complete", { description: "Your 8K video is ready to review." });
          setOperationName(null);
        } else if (pollAttemptsRef.current > 24) {
          setIsGenerating(false);
          toast.error("Timed out waiting for Veo", { description: "Try regenerating with updated parameters." });
        } else {
          pollOperation(name, json.throttleSeconds ?? 8);
        }
      } catch (error) {
        console.error(error);
        setIsGenerating(false);
        setStatusMessage("Generation failed");
        toast.error("Failed to fetch render status", { description: (error as Error).message });
      }
    }, delaySeconds * 1000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setStatusMessage("Dispatching prompt to Veo orchestration...");
    setVideoUrl(null);
    setPollAttempts(0);
    pollAttemptsRef.current = 0;

    try {
      const payload = {
        prompt,
        durationSeconds: Number(duration),
        aspectRatio,
        cameraStyle,
        visualStyle,
        fps,
        referenceImageBase64: referenceBase64
      };

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = (await response.json()) as GenerateResponse;

      if (!response.ok || json.error) {
        throw new Error(json.error ?? "Failed to start Veo generation");
      }

      if (json.done && json.videoUris && json.videoUris.length > 0) {
        setVideoUrl(json.videoUris[0] ?? null);
        setStatusMessage("Completed — download ready.");
        toast.success("Veo render complete", { description: "Your 8K video is ready to review." });
        setIsGenerating(false);
        return;
      }

      setOperationName(json.operationName);
      setStatusMessage("Awaiting Veo render completion...");
      toast("Veo is rendering", { description: formatStatus("High fidelity frames coming online.") });
      pollOperation(json.operationName, json.throttleSeconds ?? 6);
    } catch (error) {
      console.error(error);
      toast.error("Generation failed", { description: (error as Error).message });
      setStatusMessage("Generation failed");
      setIsGenerating(false);
    }
  };

  const handleReference = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReferenceBase64(null);
      setReferenceName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Unsupported reference", { description: "Only image files are allowed for conditioning." });
      return;
    }

    const base64 = await bytesFromFile(file);
    setReferenceBase64(base64);
    setReferenceName(file.name);
  };

  const resetReference = () => {
    setReferenceBase64(null);
    setReferenceName(null);
  };

  const disableGenerate = !prompt || isGenerating;

  return (
    <div className="relative flex min-h-screen flex-col gap-12 bg-slate-950/95 px-6 pb-16 pt-14 sm:px-10 lg:px-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-mesh-gradient opacity-60 blur-3xl" />
      <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Aurora Veo Studio</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">Direct 8K Veo 3.1 Cinematics</h1>
        </div>
        <Button asChild variant="secondary">
          <a href="https://ai.google.dev/models/veo" target="_blank" rel="noreferrer">
            VEO 3.1 Spec →
          </a>
        </Button>
      </nav>

      <main className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <section className="glass relative rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 shadow-xl shadow-sky-500/10">
          <header className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Prompt Architecture</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">Describe your cinematic sequence</h2>
            <p className="mt-1 text-sm text-slate-400">{cinematicTagline}</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Cinematic Prompt</label>
              <Textarea placeholder="8K aerial establishing shot of..." value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
              <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                <span>{prompt.length} characters</span>
                <span className="text-right">{Math.ceil(prompt.split(" ").length)} tokens est.</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Duration (s)</label>
                <Input min={5} max={60} type="number" value={duration} onChange={(event) => setDuration(event.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Aspect Ratio</label>
                <Select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
                  {ASPECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Camera Motion</label>
                <Select value={cameraStyle} onChange={(event) => setCameraStyle(event.target.value)}>
                  {CAMERA_STYLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Visual Grade</label>
                <Select value={visualStyle} onChange={(event) => setVisualStyle(event.target.value)}>
                  {VISUAL_STYLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Frame Rate</label>
                <Select value={String(fps)} onChange={(event) => setFps(Number(event.target.value))}>
                  {FPS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} fps
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Reference Image</label>
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
                    type="file"
                    accept="image/*"
                    onChange={handleReference}
                  />
                  {referenceName && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetReference}>
                      Clear
                    </Button>
                  )}
                </div>
                {referenceName && <p className="text-xs text-slate-500">Conditioning with {referenceName}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Realtime Storyboard</p>
                  <p className="text-sm text-slate-400">Select a preset to jumpstart direction.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPrompt("")}>
                  Reset
                </Button>
              </div>
              <PromptPresets onSelect={setPrompt} />
            </div>

            <Button type="submit" disabled={disableGenerate} className="h-12">
              {isGenerating ? "Rendering with Veo…" : "Generate 8K Cinematic"}
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-6">
          <div className="glass rounded-3xl border border-slate-800/60 bg-slate-900/40 p-8 shadow-xl shadow-cyan-500/10">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Render Status</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Veo Pipeline Monitor</h2>
              </div>
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-300"
              >
                {isGenerating ? "Live" : "Standby"}
              </motion.span>
            </header>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <span>Prompt Parsing</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{prompt ? "Loaded" : "Idle"}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <span>Veo Scheduler</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{operationName ? "In Queue" : "—"}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <span>Frame Synthesis</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{isGenerating ? "Rendering" : "Standby"}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3">
                <span>Status</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{statusMessage}</span>
              </li>
            </ul>
          </div>

          <VideoPreview videoUrl={videoUrl} isProcessing={isGenerating} statusMessage={statusMessage} />
        </section>
      </main>

      <footer className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Veo 3.1 orchestrated via Aurora pipeline.</p>
        <p>Ensure `GOOGLE_VEO_API_KEY` is configured in your Vercel environment.</p>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
