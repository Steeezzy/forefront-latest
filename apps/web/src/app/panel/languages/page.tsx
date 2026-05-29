"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Globe, Volume2 } from "lucide-react";
import { languages } from "@/data/languages";

export default function LanguagesPage() {
  const [selected, setSelected] = useState<string[]>(["en-IN"]);
  const [search, setSearch] = useState("");

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.includes(search)
  );

  const toggleLanguage = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-dim text-2xl">
          🌐
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Language Pack
          </h2>
          <p className="text-[13px] text-text-secondary">
            Powered by Sarvam AI — 22 Indian languages with native voices
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search languages..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-border-default bg-bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-accent"
      />

      {/* Selected */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((code) => {
            const lang = languages.find((l) => l.code === code);
            return (
              <span
                key={code}
                className="flex items-center gap-1.5 rounded-full bg-accent-dim px-3 py-1.5 text-[12px] font-semibold text-accent"
              >
                {lang?.flag} {lang?.name}
                <button onClick={() => toggleLanguage(code)} className="ml-1 hover:text-red-500 transition-colors">
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Language Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lang) => (
          <motion.div
            key={lang.code}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => toggleLanguage(lang.code)}
            className={cn(
              "cursor-pointer rounded-xl border p-4 transition-all",
              selected.includes(lang.code)
                ? "border-accent bg-accent-dim"
                : "border-border-subtle bg-bg-card hover:border-border-default"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{lang.flag}</span>
                <div>
                  <div className="text-[14px] font-semibold text-text-primary">
                    {lang.name}
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {lang.native}
                  </div>
                </div>
              </div>
              {selected.includes(lang.code) && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                  <Check size={12} className="text-black" />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <Volume2 size={11} /> {lang.voices[0]}
              </span>
              <span className="flex items-center gap-1">
                <Volume2 size={11} /> {lang.voices[1]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4">
        <button className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-110 shadow-lg shadow-accent/20">
          Save Language Preferences ({selected.length} selected)
        </button>
      </div>
    </div>
  );
}
