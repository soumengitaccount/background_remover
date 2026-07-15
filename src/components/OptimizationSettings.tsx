import React from "react";
import { 
  Zap, 
  Layers, 
  Cpu, 
  HelpCircle,
  Activity,
  Award,
  Settings,
  Flame,
  Check
} from "lucide-react";

interface OptimizationSettingsProps {
  modelType: "isnet" | "isnet_fp16" | "isnet_quint8";
  setModelType: (val: "isnet" | "isnet_fp16" | "isnet_quint8") => void;
  device: "cpu" | "gpu";
  setDevice: (val: "cpu" | "gpu") => void;
  proxyToWorker: boolean;
  setProxyToWorker: (val: boolean) => void;
  onReprocess?: () => void;
  isProcessing?: boolean;
}

export function OptimizationSettings({
  modelType,
  setModelType,
  device,
  setDevice,
  proxyToWorker,
  setProxyToWorker,
  onReprocess,
  isProcessing = false
}: OptimizationSettingsProps) {
  return (
    <div id="performance-settings-card" className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/85 p-5 rounded-3xl shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 text-amber-500 p-1.5 rounded-xl">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Performance Engine
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-semibold">
                Client-Side AI
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Optimize download size and segmentation speed
            </p>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          AI Model Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Ultra Fast: Quint8 */}
          <button
            type="button"
            onClick={() => setModelType("isnet_quint8")}
            className={`p-3 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
              modelType === "isnet_quint8"
                ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5 ring-2 ring-emerald-500/10"
                : "border-slate-150 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                ~11 MB
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
              Ultra-Fast
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              8-bit quantized. 75% smaller downloads. Best for slower connections & mobile.
            </p>
            {modelType === "isnet_quint8" && (
              <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Balanced: FP16 */}
          <button
            type="button"
            onClick={() => setModelType("isnet_fp16")}
            className={`p-3 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
              modelType === "isnet_fp16"
                ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5 ring-2 ring-emerald-500/10"
                : "border-slate-150 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                ~22 MB
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
              Balanced
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              16-bit quantized. High speed & high refinement. Recommended for most users.
            </p>
            {modelType === "isnet_fp16" && (
              <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Premium: Standard */}
          <button
            type="button"
            onClick={() => setModelType("isnet")}
            className={`p-3 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
              modelType === "isnet"
                ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5 ring-2 ring-emerald-500/10"
                : "border-slate-150 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-lg bg-blue-500/10 text-blue-500">
                <Award className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                ~44 MB
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
              Max Quality
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Standard precision. Best edge detailing on complex items. Slowest load time.
            </p>
            {modelType === "isnet" && (
              <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* GPU / CPU Selection and Worker Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Device Mode */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Execution Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
            <button
              type="button"
              onClick={() => setDevice("gpu")}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                device === "gpu"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              GPU (Fastest)
            </button>
            <button
              type="button"
              onClick={() => setDevice("cpu")}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                device === "cpu"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              CPU Only
            </button>
          </div>
        </div>

        {/* Worker Toggle */}
        <div className="space-y-2 flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Thread Isolation
          </label>
          <label className="relative flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/80 transition-all select-none">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Web Worker Thread
              </span>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                Prevents page freezing during processing
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={proxyToWorker}
                onChange={(e) => setProxyToWorker(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </div>
          </label>
        </div>
      </div>

      {/* Reprocess Trigger inside Workspace */}
      {onReprocess && (
        <div className="pt-2 animate-in fade-in duration-300">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onReprocess}
            id="reprocess-with-settings-btn"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950" />
            Apply Settings & Reprocess Image
          </button>
        </div>
      )}
    </div>
  );
}
