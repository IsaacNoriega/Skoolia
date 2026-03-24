"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";

const states = MEXICO_STATES;

export function CityInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v) return states;
    return states.filter((state) =>
      state.toLowerCase().includes(v)
    );
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* INPUT */}
      <div className="flex items-center px-4 py-3 rounded-xl transition focus-within:bg-neutral-50">
        <MapPin className="text-black mr-3" size={26} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="p. ej. Jalisco, Puebla"
          className="bg-transparent outline-none w-full text-base placeholder:text-black/56"
        />
      </div>

      {/* DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-2 z-50"
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-xl border border-neutral-200 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">

              {/* CERCA DE MI (SIEMPRE PRIMERO) */}
              <motion.button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange("Cerca de mí");
                  requestAnimationFrame(() =>
                    inputRef.current?.focus()
                  );
                  setOpen(false);
                }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-2 px-3 py-3 text-left rounded-xl hover:bg-neutral-100 transition font-medium text-[#1973FC]"
              >
                <Navigation size={16} />
                Cerca de mí
              </motion.button>

              <div className="h-px bg-neutral-200 my-2" />

              {/* ESTADOS */}
              {filtered.map((state, index) => (
                <motion.button
                  key={state}
                  type="button"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(resolveMexicanState(state) ?? state);
                    requestAnimationFrame(() =>
                      inputRef.current?.focus()
                    );
                    setOpen(false);
                  }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2 px-3 py-3 text-left rounded-xl hover:bg-neutral-100 transition"
                >
                  <MapPin size={16} className="text-neutral-500" />
                  <span className="text-sm text-neutral-900">
                    {state}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}