import { motion } from "framer-motion";

interface VideoPreviewProps {
  videoUrl?: string | null;
  isProcessing: boolean;
  statusMessage: string;
}

export function VideoPreview({ videoUrl, isProcessing, statusMessage }: VideoPreviewProps) {
  if (!videoUrl) {
    return (
      <div className="glass relative flex h-full min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10 text-center">
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 6 }} className="rounded-full border border-slate-700/40 bg-slate-900/60 p-6">
          <div className="h-16 w-16 rounded-full border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-teal-500/10 shadow-lg shadow-sky-500/20" />
        </motion.div>
        <p className="mt-6 text-sm text-slate-400">Your Veo masterpiece will render here in 8K glory.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800/60 bg-black/80 shadow-2xl">
      <video className="h-full w-full" src={videoUrl} autoPlay controls loop playsInline />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-6 py-4 text-xs uppercase tracking-[0.3em] text-slate-300">
        <span>Veo 3.1</span>
        <span>8K Cinematic</span>
      </div>
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="h-16 w-16 rounded-full border border-sky-500/40 bg-sky-500/10" />
          <p className="mt-4 text-sm text-slate-300">{statusMessage}</p>
        </div>
      )}
    </div>
  );
}
