import React, { useState, useRef, useEffect, DragEvent } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Undo2, 
  Sparkles, 
  Palette, 
  Layers, 
  Info,
  HelpCircle,
  FileImage
} from "lucide-react";
import { removeBackground } from "@imgly/background-removal";

import { ProcessingProgress, BgConfig, PresetImage } from "./types";
import { GalleryPresets, PRESETS } from "./components/GalleryPresets";
import { CameraCapture } from "./components/CameraCapture";
import { ImageComparison } from "./components/ImageComparison";
import { AIBackdropManager } from "./components/AIBackdropManager";
import { OptimizationSettings } from "./components/OptimizationSettings";

export default function App() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/png");
  
  // Performance optimizations
  const [modelType, setModelType] = useState<"isnet" | "isnet_fp16" | "isnet_quint8">("isnet_fp16");
  const [device, setDevice] = useState<"cpu" | "gpu">("gpu");
  const [proxyToWorker, setProxyToWorker] = useState<boolean>(true);
  const [originalFile, setOriginalFile] = useState<File | Blob | null>(null);
  
  // UI states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  
  // Background style configs
  const [bgConfig, setBgConfig] = useState<BgConfig>({
    type: "transparent",
    value: "",
  });

  // Processing state
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: "idle",
    percent: 0,
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  // Helper: Convert Blob/File to Base64
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Run AI Background Removal fully client-side using @imgly/background-removal
  const runBackgroundRemoval = async (imageSource: File | Blob, customModel = modelType, customDevice = device, customProxy = proxyToWorker) => {
    const modelLabel = customModel === "isnet_quint8" ? "8-bit Fast" : customModel === "isnet_fp16" ? "16-bit Balanced" : "32-bit HQ";
    setProgress({
      status: "loading_model",
      percent: 5,
      message: `Initializing AI Engine (using ${modelLabel} model on ${customDevice.toUpperCase()})...`,
    });

    try {
      const resultBlob = await removeBackground(imageSource, {
        model: customModel,
        device: customDevice,
        proxyToWorker: customProxy,
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100);
          let message = "AI processing image...";
          
          if (key.includes("fetch")) {
            message = `Downloading background removal model assets (${modelLabel})...`;
          } else if (key.includes("model") || key.includes("load")) {
            message = "Loading neural network into memory...";
          } else if (key.includes("compute") || key.includes("process")) {
            message = `Segmenting subject on ${customDevice.toUpperCase()}...`;
          } else {
            message = `${key.charAt(0).toUpperCase() + key.slice(1)}...`;
          }

          setProgress({
            status: "processing",
            percent,
            message: `${message} (${percent}%)`,
          });
        },
      });

      setProgress({
        status: "processing",
        percent: 95,
        message: "Rendering transparent subject...",
      });

      const url = URL.createObjectURL(resultBlob);
      setProcessedUrl(url);
      setProgress({
        status: "idle",
        percent: 100,
        message: "",
      });
    } catch (error: any) {
      console.error("Background removal error:", error);
      setProgress({
        status: "failed",
        percent: 0,
        message: error.message || "Failed to remove background. Please try another image.",
      });
    }
  };

  // Handle Preset Choice
  const handleSelectPreset = async (preset: PresetImage) => {
    setSelectedPresetId(preset.id);
    setMimeType(preset.mimeType);
    
    setProgress({
      status: "processing",
      percent: 5,
      message: "Fetching sample preset...",
    });

    try {
      // Use proxy to avoid CORS canvas-tainting issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(preset.url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch image proxy");
      const blob = await response.blob();
      
      const base64 = await fileToBase64(blob);
      setOriginalUrl(proxyUrl);
      setOriginalBase64(base64);
      setOriginalFile(blob);
      
      // Start processing
      runBackgroundRemoval(blob);
    } catch (err: any) {
      console.error("Preset loading error:", err);
      setProgress({
        status: "failed",
        percent: 0,
        message: "Failed to load preset. Please try importing your own photo instead.",
      });
    }
  };

  // Handle File Input selection
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setProgress({
        status: "failed",
        percent: 0,
        message: "Invalid file type. Please upload an image file (PNG, JPG, WEBP).",
      });
      return;
    }

    setSelectedPresetId(undefined);
    setMimeType(file.type);
    
    setProgress({
      status: "processing",
      percent: 5,
      message: "Reading photo data...",
    });

    try {
      const localUrl = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      setOriginalUrl(localUrl);
      setOriginalBase64(base64);
      setOriginalFile(file);

      // Start processing
      runBackgroundRemoval(file);
    } catch (err: any) {
      console.error("File reading error:", err);
      setProgress({
        status: "failed",
        percent: 0,
        message: "Failed to process photo. Please try again.",
      });
    }
  };

  // Drag and Drop listeners
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  // Handle camera capture snapshot
  const handleCameraCapture = async (dataUrl: string) => {
    setIsCameraOpen(false);
    setSelectedPresetId(undefined);
    setMimeType("image/png");

    setProgress({
      status: "processing",
      percent: 5,
      message: "Analyzing snapshot...",
    });

    try {
      setOriginalUrl(dataUrl);
      setOriginalBase64(dataUrl);

      // Convert dataUrl to Blob for model
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      setOriginalFile(blob);

      runBackgroundRemoval(blob);
    } catch (err: any) {
      console.error("Camera capture process error:", err);
      setProgress({
        status: "failed",
        percent: 0,
        message: "Failed to process captured camera snapshot.",
      });
    }
  };

  // Custom Backdrop Upload
  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setBgConfig({
        type: "custom",
        value: base64,
      });
    } catch (err) {
      console.error("Failed to read custom background:", err);
    }
  };

  // Canvas Compositing & Export Download
  const handleExport = () => {
    if (!processedUrl) return;

    // If AI background is pre-blended on the server, download it directly
    if (bgConfig.type === "ai" && bgConfig.value) {
      const link = document.createElement("a");
      link.download = `ai-backdrop-${Date.now()}.png`;
      link.href = bgConfig.value;
      link.click();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw Background style
      if (bgConfig.type === "solid") {
        ctx.fillStyle = bgConfig.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgConfig.type === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (bgConfig.value === "grad-sunset") {
          grad.addColorStop(0, "#ff7e5f");
          grad.addColorStop(1, "#feb47b");
        } else if (bgConfig.value === "grad-ocean") {
          grad.addColorStop(0, "#2b5876");
          grad.addColorStop(1, "#4e4376");
        } else if (bgConfig.value === "grad-neon") {
          grad.addColorStop(0, "#ec4899");
          grad.addColorStop(1, "#8b5cf6");
        } else if (bgConfig.value === "grad-emerald") {
          grad.addColorStop(0, "#10b981");
          grad.addColorStop(1, "#3b82f6");
        } else {
          grad.addColorStop(0, "#f3f4f6");
          grad.addColorStop(1, "#d1d5db");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgConfig.type === "custom") {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          // Fit-cover calculation for background image
          const bgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          const canvasRatio = canvas.width / canvas.height;
          let drawW = canvas.width;
          let drawH = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (bgRatio > canvasRatio) {
            drawW = canvas.height * bgRatio;
            offsetX = (canvas.width - drawW) / 2;
          } else {
            drawH = canvas.width / bgRatio;
            offsetY = (canvas.height - drawH) / 2;
          }

          ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
          // Draw transparent foreground on top
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          triggerDownload(canvas);
        };
        bgImg.src = bgConfig.value;
        return;
      }

      // 2. Draw transparent foreground image over background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      triggerDownload(canvas);
    };
    img.src = processedUrl;
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `nobg-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Preset quick triggers
  const handleReset = () => {
    setOriginalUrl(null);
    setOriginalBase64(null);
    setProcessedUrl(null);
    setOriginalFile(null);
    setSelectedPresetId(undefined);
    setBgConfig({ type: "transparent", value: "" });
    setProgress({ status: "idle", percent: 0, message: "" });
  };

  // Determine current display background styles
  const getComparisonBgClass = () => {
    if (bgConfig.type === "transparent") return "bg-transparency-grid";
    if (bgConfig.type === "gradient") {
      if (bgConfig.value === "grad-sunset") return "bg-gradient-to-b from-[#ff7e5f] to-[#feb47b]";
      if (bgConfig.value === "grad-ocean") return "bg-gradient-to-b from-[#2b5876] to-[#4e4376]";
      if (bgConfig.value === "grad-neon") return "bg-gradient-to-b from-[#ec4899] to-[#8b5cf6]";
      if (bgConfig.value === "grad-emerald") return "bg-gradient-to-b from-[#10b981] to-[#3b82f6]";
      return "bg-gradient-to-b from-slate-100 to-slate-200";
    }
    return ""; // For solid or custom base64/url, we use inline styles
  };

  const getComparisonBgInlineStyle = (): React.CSSProperties | undefined => {
    if (bgConfig.type === "solid") {
      return { backgroundColor: bgConfig.value };
    }
    if (bgConfig.type === "custom") {
      return { 
        backgroundImage: `url(${bgConfig.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      };
    }
    if (bgConfig.type === "ai") {
      return {
        backgroundImage: `url(${bgConfig.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      };
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col transition-colors duration-300">
      
      {/* Top Header Bar */}
      <header id="app-header" className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Transparent BG AI
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Instant Automatic Background Remover
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              100% Free & Local
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        {originalUrl === null ? (
          /* ---------------- LAUNCHER PANEL (Initial Upload/Select screen) ---------------- */
          <div id="launcher-panel" className="max-w-2xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Remove backgrounds in 1 second.
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Upload a photo, snap one live, or click a preset sample below. No signup, fully automated, secure, and instant.
              </p>
            </div>

            {/* Main Interactive Dropzone Card */}
            <div
              id="upload-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px] bg-white dark:bg-slate-900 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10 scale-[1.02]"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
                id="file-upload-input"
              />

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full border border-slate-100 dark:border-slate-800 text-slate-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>

              <div className="mt-5 space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Drag and drop your photo here
                </p>
                <p className="text-xs text-slate-400">
                  Supports PNG, JPEG, WEBP up to 20MB
                </p>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all">
                  Browse Files
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCameraOpen(true);
                  }}
                  id="open-camera-launcher-btn"
                  className="px-4 py-2 bg-white dark:bg-slate-950 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-500" />
                  Take Live Photo
                </button>
              </div>
            </div>

            {/* Performance Engine Optimization Settings */}
            <OptimizationSettings
              modelType={modelType}
              setModelType={setModelType}
              device={device}
              setDevice={setDevice}
              proxyToWorker={proxyToWorker}
              setProxyToWorker={setProxyToWorker}
              isProcessing={progress.status !== "idle"}
            />

            {/* Preset Samples */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs">
              <GalleryPresets
                selectedId={selectedPresetId}
                onSelect={handleSelectPreset}
              />
            </div>

            {/* Offline and Local info badge */}
            <div className="flex items-start gap-3 bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl">
              <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  How does it work locally?
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Transparent BG AI processes your image entirely on your device using WebAssembly and deep learning. Your photos are private, secure, and never uploaded to external storage.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ---------------- WORKSPACE PANEL (Active editing screen) ---------------- */
          <div id="workspace-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Comparison Slider Frame (Left Panel: 7 Columns) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 sm:p-6 rounded-3xl shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  onClick={handleReset}
                  id="reset-workspace-btn"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Upload Different Photo
                </button>
                
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  {selectedPresetId ? `Preset: ${selectedPresetId}` : "Custom Image"}
                </span>
              </div>

              {/* Status and Progress Loader */}
              {progress.status !== "idle" && (
                <div id="workspace-loading-bar" className="space-y-2.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      {progress.message}
                    </span>
                    <span className="font-mono font-bold text-emerald-500">{progress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Slider View Component */}
              {processedUrl ? (
                <ImageComparison
                  originalUrl={originalUrl}
                  processedUrl={processedUrl}
                  bgStyleClass={getComparisonBgClass()}
                  bgInlineStyle={getComparisonBgInlineStyle()}
                />
              ) : (
                /* Fallback preview while loading */
                <div className="relative aspect-square rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <img
                    src={originalUrl}
                    alt="Original Draft"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain opacity-50"
                  />
                  <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-xs text-white font-semibold">
                      Isolating foreground subject...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls panel (Right Panel: 5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 1: Background Style Customizer */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Palette className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Background Settings
                  </h3>
                </div>

                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                  {(["transparent", "solid", "gradient", "custom", "ai"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (type === "transparent") setBgConfig({ type, value: "" });
                        else if (type === "solid") setBgConfig({ type, value: "#ffffff" });
                        else if (type === "gradient") setBgConfig({ type, value: "grad-sunset" });
                        else if (type === "custom") setBgConfig({ type, value: bgConfig.type === "custom" ? bgConfig.value : "" });
                        // For AI backdrop, do not reset if already set
                      }}
                      id={`bg-tab-${type}`}
                      className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                        bgConfig.type === type
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Conditional Sub-panels for configurations */}
                {bgConfig.type === "solid" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Choose Solid Color
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        "#ffffff", // White
                        "#000000", // Black
                        "#f8fafc", // Slate 50
                        "#ef4444", // Red
                        "#3b82f6", // Blue
                        "#10b981", // Green
                        "#f59e0b", // Yellow
                        "#8b5cf6", // Purple
                        "#ec4899", // Pink
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBgConfig({ type: "solid", value: color })}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 shadow-xs ${
                            bgConfig.value === color
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {/* Color Picker Input */}
                      <input
                        type="color"
                        value={bgConfig.value.startsWith("#") ? bgConfig.value : "#ffffff"}
                        onChange={(e) => setBgConfig({ type: "solid", value: e.target.value })}
                        className="w-7 h-7 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800 cursor-pointer hover:scale-110"
                        title="Custom Color Picker"
                      />
                    </div>
                  </div>
                )}

                {bgConfig.type === "gradient" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Select Gradient Backdrop
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "grad-sunset", name: "Warm Sunset", class: "from-[#ff7e5f] to-[#feb47b]" },
                        { id: "grad-ocean", name: "Deep Ocean", class: "from-[#2b5876] to-[#4e4376]" },
                        { id: "grad-neon", name: "Cyber Neon", class: "from-[#ec4899] to-[#8b5cf6]" },
                        { id: "grad-emerald", name: "Mint Emerald", class: "from-[#10b981] to-[#3b82f6]" },
                      ].map((grad) => (
                        <button
                          key={grad.id}
                          onClick={() => setBgConfig({ type: "gradient", value: grad.id })}
                          className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            bgConfig.value === grad.id
                              ? "border-emerald-500 bg-emerald-500/5"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${grad.class} shrink-0`} />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {grad.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bgConfig.type === "custom" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Upload Custom Backdrop Image
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => customBgInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Choose Backdrop Photo
                      </button>
                      <input
                        ref={customBgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCustomBgUpload}
                        className="hidden"
                      />
                      {bgConfig.value ? (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Custom BG Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          No background uploaded yet
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {bgConfig.type === "ai" && (
                  <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          AI Generated Backdrop Active
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Use the Gemini AI tool below to write a prompt and generate beautiful custom backdrops.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Engine Optimization Settings */}
              <OptimizationSettings
                modelType={modelType}
                setModelType={setModelType}
                device={device}
                setDevice={setDevice}
                proxyToWorker={proxyToWorker}
                setProxyToWorker={setProxyToWorker}
                onReprocess={() => originalFile && runBackgroundRemoval(originalFile)}
                isProcessing={progress.status !== "idle"}
              />

              {/* Card 2: AI Backdrop Generator Panel (Visible when ready) */}
              {processedUrl && originalBase64 && (
                <AIBackdropManager
                  imageBase64={originalBase64}
                  mimeType={mimeType}
                  onApplyAiBackground={(aiImageUrl) => {
                    setBgConfig({
                      type: "ai",
                      value: aiImageUrl,
                    });
                  }}
                  disabled={progress.status !== "idle"}
                />
              )}

              {/* Card 3: Download and Reset Actions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-xs space-y-3">
                <button
                  onClick={handleExport}
                  disabled={!processedUrl}
                  id="download-highres-btn"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  Download Background-Removed PNG
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Clear and Upload Another Photo
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Floating Active WebCam modal portal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Footer copyright */}
      <footer className="border-t border-slate-150 dark:border-slate-850 py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Transparent BG AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Processed fully on-device with
            <span className="font-bold text-emerald-500">WebAssembly</span>
            & Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
