import React from "react";
import { PresetImage } from "../types";
import { Sparkles } from "lucide-react";

interface GalleryPresetsProps {
  selectedId?: string;
  onSelect: (preset: PresetImage) => void;
  disabled?: boolean;
}

export const PRESETS: PresetImage[] = [
  {
    id: "sneaker",
    name: "Red Running Shoe",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80",
    mimeType: "image/jpeg",
  },
  {
    id: "plant",
    name: "Succulent Plant",
    url: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=150&q=80",
    mimeType: "image/jpeg",
  },
  {
    id: "donut",
    name: "Glazed Donut",
    url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=150&q=80",
    mimeType: "image/jpeg",
  },
  {
    id: "sunglasses",
    name: "Classic Sunglasses",
    url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=150&q=80",
    mimeType: "image/jpeg",
  },
];

export const GalleryPresets: React.FC<GalleryPresetsProps> = ({
  selectedId,
  onSelect,
  disabled = false,
}) => {
  return (
    <div id="gallery-presets-section" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-500" id="sparkle-icon" />
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Or try with a preset sample image
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {PRESETS.map((preset) => {
          const isSelected = selectedId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              onClick={() => !disabled && onSelect(preset)}
              disabled={disabled}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:shadow-sm"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={preset.name}
            >
              <img
                src={preset.thumbnailUrl}
                alt={preset.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                id={`preset-img-${preset.id}`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1.5">
                <span className="text-[10px] font-medium text-white text-center line-clamp-1">
                  {preset.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
