import React, { useState, useRef, useEffect } from "react";
import { Eye, Columns } from "lucide-react";

interface ImageComparisonProps {
  originalUrl: string;
  processedUrl: string;
  bgStyleClass: string; // Tailwind bg class for transparency grid or solids
  bgInlineStyle?: React.CSSProperties; // Solid hex backgrounds
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalUrl,
  processedUrl,
  bgStyleClass,
  bgInlineStyle,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100 %
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState<"slider" | "split">("slider");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isResizing) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div id="image-comparison-wrapper" className="space-y-4">
      {/* View Mode Selectors */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-2xl">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
          COMPARE RESULTS
        </div>
        <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "slider"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Interactive Slider
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
        </div>
      </div>

      {viewMode === "slider" ? (
        /* Slider Mode Container */
        <div
          ref={containerRef}
          id="slider-container"
          className="relative aspect-square w-full rounded-2xl overflow-hidden select-none shadow-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950"
        >
          {/* Bottom Layer: Original Image (with white background grid or default container background) */}
          <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-950">
            <img
              src={originalUrl}
              alt="Original"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">
              Original
            </div>
          </div>

          {/* Top Layer: Processed Image with Chosen Background */}
          <div
            id="processed-slider-layer"
            className={`absolute inset-0 h-full overflow-hidden ${bgStyleClass}`}
            style={{
              width: `${sliderPosition}%`,
              ...bgInlineStyle,
            }}
          >
            {/* Inner wrapper must have exact fixed width of parent to avoid image compression/shrinkage */}
            <div
              className="absolute inset-0"
              style={{
                width: containerRef.current?.getBoundingClientRect().width || "100%",
              }}
            >
              <img
                src={processedUrl}
                alt="Processed"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-emerald-500/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider">
                Transparent PNG
              </div>
            </div>
          </div>

          {/* Interactive Draggable Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white hover:bg-emerald-400 shadow-lg cursor-ew-resize z-30 transition-colors"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={() => setIsResizing(true)}
            onTouchStart={() => setIsResizing(true)}
            id="slider-handle-line"
          >
            {/* Floating Handle Arrow circular badge */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-400 shadow-xl flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110">
              <svg
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4 4 4m8-8l4 4-4 4" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Grid Mode */
        <div id="side-by-side-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              Before
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <img
                src={originalUrl}
                alt="Original"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              After (transparent)
            </div>
            <div
              className={`relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center ${bgStyleClass}`}
              style={bgInlineStyle}
            >
              <img
                src={processedUrl}
                alt="Processed"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
