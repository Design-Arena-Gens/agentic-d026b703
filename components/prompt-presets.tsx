interface PromptPreset {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

const PRESETS: PromptPreset[] = [
  {
    id: "neo-noir",
    title: "Neon Noir Downtown",
    description: "Rain-soaked night, reflective streets, dynamic dolly shots.",
    prompt:
      "8K cinematic establishing shot of a futuristic neon-lit downtown at night. Rain falls heavily, streets glisten with reflections, volumetric fog rolls between skyscrapers, camera performs a slow continuous dolly with parallax signage, ultra-realistic lighting, anamorphic lens flares, dynamic contrast, Dolby Vision grading."
  },
  {
    id: "nature",
    title: "Alpine Dawn Hyperlapse",
    description: "Epic landscape transition with time-lapse clouds and sun.",
    prompt:
      "8K Ultra HD panoramic hyperlapse of alpine mountains at dawn. Clouds tumble over peaks, golden hour sunlight spills across forests, lens captures aerial glide forward, cinematic depth of field, photoreal foliage simulation, atmospheric scattering, IMAX-style grandeur."
  },
  {
    id: "sports",
    title: "Circuit Chase Drone",
    description: "Drone chase of hypercar with cinematic motion blur.",
    prompt:
      "8K 120fps drone pursuit of a graphite hypercar racing along a coastal cliff road. High-speed chase with dramatic camera banks, heat shimmer, motion blur, reflective carbon fiber, ocean spray mist, dynamic range optimized for HDR10+. Cinematic color palette, intense pacing."
  }
];

interface PromptPresetsProps {
  onSelect: (prompt: string) => void;
}

export function PromptPresets({ onSelect }: PromptPresetsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          className="group rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-left transition hover:border-sky-500/60 hover:bg-slate-900/80"
          onClick={() => onSelect(preset.prompt)}
          type="button"
        >
          <p className="text-sm font-semibold text-slate-100">{preset.title}</p>
          <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
          <p className="mt-3 text-[11px] leading-4 text-slate-500">{preset.prompt}</p>
          <span className="mt-3 inline-flex items-center text-[10px] uppercase tracking-[0.3em] text-sky-400 opacity-0 transition group-hover:opacity-100">
            Load Prompt →
          </span>
        </button>
      ))}
    </div>
  );
}
