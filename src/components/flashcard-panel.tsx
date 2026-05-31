"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import type { Flashcard } from "@/server/services/learning-assets";

export function FlashcardPanel({ flashcards }: { flashcards: Flashcard[] }) {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  if (!flashcards.length) {
    return (
      <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm leading-6 text-zinc-400">
        Flashcard belum tersedia karena dokumen belum memiliki istilah teknis atau
        poin utama yang cukup.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {flashcards.map((card) => {
        const isFlipped = Boolean(flippedCards[card.id]);

        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={isFlipped}
            onClick={() =>
              setFlippedCards((current) => ({
                ...current,
                [card.id]: !current[card.id],
              }))
            }
            className="flashcard-shell motion-card rounded-lg text-left"
          >
            <div className={`flashcard-inner ${isFlipped ? "is-flipped" : ""}`}>
              <div className="flashcard-face rounded-lg border border-zinc-700 bg-[#111315] p-4 transition-colors hover:border-blue-400">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-200">
                    {card.tag}
                  </span>
                  <RotateCw className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="flashcard-content mt-5 text-base font-semibold leading-7 text-white">
                  {card.front}
                </p>
              </div>
              <div className="flashcard-face flashcard-back rounded-lg border border-blue-400/50 bg-[#0f1720] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-200">
                    Jawaban
                  </span>
                  <RotateCw className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="flashcard-content mt-5 text-base font-semibold leading-7 text-white">
                  {card.back}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
