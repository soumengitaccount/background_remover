import React, { useState, useEffect } from "react";
import { AnalysisResult, BackgroundSuggestion } from "../types";
import { Sparkles, MessageSquare, Compass, Send, Check, Loader2, AlertCircle } from "lucide-react";

interface AIBackdropManagerProps {
  imageBase64: string; // Original image in base64
  mimeType: string;
  onApplyAiBackground: (aiImageUrl: string) => void;
  disabled?: boolean;
}

export const AIBackdropManager: React.FC<AIBackdropManagerProps> = ({
  imageBase64,
  mimeType,
  onApplyAiBackground,
  disabled = false,
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSecretError, setHasSecretError] = useState(false);

  // Auto-analyze when image changes
  const runAnalysis = async () => {
    if (!imageBase64 || disabled) return;
    setIsAnalyzing(true);
    setError(null);
    setHasSecretError(false);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64.split(",")[1] || imageBase64,
          mimeType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || `Error: ${res.status}`;
        if (msg.includes("GEMINI_API_KEY")) {
          setHasSecretError(true);
        }
        throw new Error(msg);
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error("Failed to analyze image with Gemini:", err);
      setError(err.message || "Failed to analyze image. Please check your internet connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [imageBase64]);

  const handleSuggestionClick = (suggestion: BackgroundSuggestion) => {
    setCustomPrompt(suggestion.prompt);
  };

  const handleGenerateBackdrop = async () => {
    if (!customPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64.split(",")[1] || imageBase64,
          mimeType,
          prompt: customPrompt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error generating background: ${res.status}`);
      }

      const data = await res.json();
      if (data.image) {
        const url = `data:image/png;base64,${data.image}`;
        onApplyAiBackground(url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("No image data returned from generator");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setError(err.message || "Failed to generate background. Try a simpler prompt or check API settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="ai-backdrop-section" className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              AI Backdrop Generator
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generate new surroundings using Google Gemini
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Gemini Powered
        </span>
      </div>

      {hasSecretError ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            GEMINI_API_KEY Required
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            To use AI Suggestions and Background Generation, please add your 
            <code className="mx-1 px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono">GEMINI_API_KEY</code> 
            in the **Settings &gt; Secrets** panel.
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs text-red-500 font-medium">{error}</p>
          <button
            onClick={runAnalysis}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Retry AI Connection
          </button>
        </div>
      ) : (
        <>
          {/* Object Analysis Section */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                Gemini is identifying image subjects...
              </p>
            </div>
          ) : analysis ? (
            <div id="ai-analysis-output" className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Identified Subject
                </span>
                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {analysis.subjectTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {analysis.subjectDescription}
                  </p>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  Recommended Backdrop Ideas
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {analysis.backgroundSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-500/5 p-2.5 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {suggestion.theme}
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-normal group-hover:text-slate-800 dark:group-hover:text-white">
                          "{suggestion.prompt}"
                        </p>
                      </div>
                      <Send className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 shrink-0 self-center transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <button
                onClick={runAnalysis}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Image with Gemini
              </button>
            </div>
          )}

          {/* Custom Backdrop Textbox */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Describe Your Backdrop
            </label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., A professional marble table in a glowing neon showcase room..."
                id="ai-backdrop-prompt"
                rows={3}
                disabled={isGenerating || disabled}
                className="w-full text-xs p-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/15 resize-none placeholder-slate-400"
              />
            </div>
            
            <button
              onClick={handleGenerateBackdrop}
              disabled={isGenerating || !customPrompt.trim() || disabled}
              id="generate-backdrop-btn"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-slate-950 dark:disabled:text-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-98 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Generating & Blending Background...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  Background Applied!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Generate AI Backdrop
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
