import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, Video } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Initialize camera
  const startCamera = async (deviceId?: string) => {
    try {
      setPermissionError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "user" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // List devices to allow swapping
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput");
      setDevices(videoDevices);
      
      if (!deviceId && videoDevices.length > 0) {
        // Find which device was actually active
        const activeTrack = stream.getVideoTracks()[0];
        const activeLabel = activeTrack?.label;
        const matchedDevice = videoDevices.find((d) => d.label === activeLabel);
        if (matchedDevice) {
          setSelectedDeviceId(matchedDevice.deviceId);
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setPermissionError(
        "Could not access camera. Please ensure permissions are granted and no other app is using it."
      );
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  const triggerCapture = () => {
    if (countdown !== null) return;
    
    // Start a neat 3s countdown
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      setCountdown(null);
      captureSnapshot();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const captureSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger flash visual effect
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror the output if it's the front camera
      const isFront = !selectedDeviceId || 
        devices.find((d) => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes("front") ||
        devices.length === 0;

      if (isFront) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      onCapture(dataUrl);
    }
  };

  return (
    <div
      id="camera-capture-overlay"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
    >
      <div
        id="camera-modal"
        className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Flash Effect */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            <h2 className="text-white font-semibold">Live Camera Capture</h2>
          </div>
          <button
            onClick={onClose}
            id="close-camera-btn"
            className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Frame */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <p className="text-red-400 text-sm font-medium">{permissionError}</p>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Retry Camera Connection
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // Standard mirror for preview
              />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                  <span className="text-7xl font-bold text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Grid Overlay lines to look professional */}
              <div className="absolute inset-0 border border-white/10 pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white/40" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white/40" />
                </div>
                <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white/40" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white/40" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-900">
          {/* Device Selector */}
          <div className="flex items-center gap-2">
            {devices.length > 1 && (
              <div className="relative flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  id="camera-device-select"
                  className="bg-slate-900 border border-slate-800 text-white py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  {devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all cursor-pointer border border-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={triggerCapture}
              disabled={!!permissionError || countdown !== null}
              id="snap-photo-btn"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {countdown !== null ? "Get Ready..." : "Capture Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
