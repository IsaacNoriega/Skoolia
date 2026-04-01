"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface AISearchModeProps {
  onClose: () => void;
}

export function AISearchMode({ onClose }: AISearchModeProps) {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    "Primaria bilingüe en CDMX",
    "Escuelas con enfoque Montessori",
    "Secundaria con deportes",
    "Universidad privada económica",
  ];

  async function sendPrompt(message: string) {
    const value = message.trim();
    if (!value || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        warning?: string;
        sources?: Array<{ title: string; uri: string }>;
      };

      if (!res.ok) {
        setReply(null);
        setSources([]);
        setWarning(null);
        setError(data.error ?? "No se pudo obtener respuesta de la IA.");
        return;
      }

      setReply(data.reply ?? "No se recibió una respuesta.");
      setSources(data.sources ?? []);
      setWarning(data.warning ?? null);
    } catch {
      setReply(null);
      setSources([]);
      setWarning(null);
      setError("Hubo un problema de red al contactar al asistente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    await sendPrompt(prompt);
  }

  async function handleSuggestionClick(suggestion: string) {
    setPrompt(suggestion);
    await sendPrompt(suggestion);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-white rounded-3xl  p-10 py-20 relative overflow-hidden"
    >
      <div className="flex flex-col items-center text-center gap-8">
        {/* 🌈 AI Orb — Moonshot Style */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Fondo respirando */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1.05, 1],
              opacity: [0.8, 1, 0.9, 0.8],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full 
    bg-[radial-gradient(circle_at_30%_30%,#ffd6e0,#fbc2eb,#a6c1ee,#fddb92)] 
    blur-2xl"
          />

          {/* Capa líquida interna */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-32 h-32 rounded-full 
    bg-[conic-gradient(from_0deg,#fbc2eb,#a6c1ee,#fddb92,#fbc2eb)] 
    blur-xl opacity-80"
          />

          {/* Núcleo suave */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative w-24 h-24 rounded-full 
    bg-[radial-gradient(circle_at_40%_40%,#ffffff,#e0c3fc,#8ec5fc)] 
    blur-md"
          />
        </div>

        <p className="text-neutral-600 max-w-md text-base leading-relaxed">
          Describe lo que estás buscando y nuestra IA te ayudará a encontrar la
          mejor opción educativa para tu familia.
        </p>

        {/* AI Suggestions */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 max-w-2xl">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                void handleSuggestionClick(suggestion);
              }}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-100 transition shadow-sm"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>

        {/* AI Input */}
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center bg-white rounded-full px-6 py-4 shadow-lg border border-neutral-200">
            <input
              placeholder="Describe lo que estás buscando..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="flex-1 bg-transparent outline-none text-base text-neutral-800 placeholder:text-neutral-400"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isLoading}
              className="ml-4 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#1973FC] transition"
            >
              {isLoading ? (
                <span className="text-xs font-semibold">...</span>
              ) : (
                <ArrowUp size={18} />
              )}
            </motion.button>
          </div>
        </div>

        {error ? (
          <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {warning ? (
          <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-800">
            {warning}
          </div>
        ) : null}

        {reply ? (
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 text-left text-sm text-neutral-700 whitespace-pre-wrap">
            {reply}
          </div>
        ) : null}

        {sources.length ? (
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Fuentes web
            </p>
            <ul className="mt-3 space-y-2">
              {sources.map((source) => (
                <li key={source.uri}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="text-sm text-neutral-500 hover:text-neutral-800 transition"
        >
          Volver a búsqueda normal
        </button>
      </div>
    </motion.div>
  );
}
