"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface MoodSelectorProps {
  onSelectMood: (mood: 'happy' | 'neutral' | 'sad') => void;
}

export function MoodSelector({ onSelectMood }: MoodSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        className="px-4 py-2 rounded-md bg-green-200 hover:bg-green-300"
        onClick={() => onSelectMood('happy')}
      >
        😊 Happy
      </button>
      <button
        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        onClick={() => onSelectMood('neutral')}
      >
        😐 Neutral
      </button>
      <button
        className="px-4 py-2 rounded-md bg-red-200 hover:bg-red-300"
        onClick={() => onSelectMood('sad')}
      >
        😣 Sad
      </button>
    </div>
  );
}
