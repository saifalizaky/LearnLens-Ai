"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import type { Flashcard } from "@/server/services/learning-assets";

export function FlashcardPanel({
  flashcards,
  storageKey = "cloudtutor.flashcards",
}: {
  flashcards: Flashcard[];
  storageKey?: string;
}) {
  const flashcardIds = useMemo(
    () => new Set(flashcards.map((card) => card.id)),
    [flashcards],
  );
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setFlippedCards(readBooleanMap(storageKey, flashcardIds));
      setIsDraftLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [flashcardIds, storageKey]);

  useEffect(() => {
    if (!isDraftLoaded) {
      return;
    }

    writeBooleanMap(storageKey, flippedCards);
  }, [flippedCards, isDraftLoaded, storageKey]);

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

function readBooleanMap(storageKey: string, allowedKeys: Set<string>) {
  const storage = getLocalStorage();

  if (!storage) {
    return {};
  }

  try {
    const rawDraft = storage.getItem(storageKey);

    if (!rawDraft) {
      return {};
    }

    const parsed: unknown = JSON.parse(rawDraft);

    if (!isRecord(parsed)) {
      storage.removeItem(storageKey);
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => allowedKeys.has(key) && typeof value === "boolean",
      ),
    ) as Record<string, boolean>;
  } catch {
    storage.removeItem(storageKey);
    return {};
  }
}

function writeBooleanMap(storageKey: string, value: Record<string, boolean>) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage quota and private browsing failures.
  }
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
