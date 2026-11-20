import React, { useRef, useEffect, useState } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import {
  Sliders,
  X,
  Sparkles,
  Sun,
  Contrast,
  Droplet,
  Focus,
  Maximize,
  Mic2,
  Check,
  RotateCcw,
} from 'lucide-react';

interface VideoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoSettingsModal: React.FC<VideoSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    localStream,
    isVideoOff,
    videoAdjustments,
    updateVideoAdjustments,
    isProNoiseSuppressionEnabled,
    toggleProNoiseSuppression,
  } = useMeetingStore();
  const { showToast } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'enhancement' | 'framing' | 'audio'>('enhancement');

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen, videoAdjustments]);

  if (!isOpen) return null;

  const handleResetColors = () => {
    updateVideoAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
    showToast('Reset color controls to default', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Video & Audio Studio Settings</h3>
              <p className="text-xs text-zinc-400">
                Touch Up appearance, adjust lighting, toggle Center Stage auto-framing & Pro noise cancellation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="relative w-full aspect-video max-h-52 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner mx-auto">
          {!isVideoOff && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`relative z-10 w-full h-full object-cover scale-x-[-1] transition-all`}
            />
          ) : (
            <div className="relative z-10 text-xs text-zinc-500">Camera is off</div>
          )}

          {/* Active Status Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
            {videoAdjustments.touchUpAppearance && (
              <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 text-[10px] font-semibold border border-pink-500/30 flex items-center gap-1 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-pink-400" />
                Touch Up {videoAdjustments.touchUpIntensity}%
              </span>
            )}
            {videoAdjustments.framingMode === 'center-stage' && (
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30 flex items-center gap-1 backdrop-blur-md">
                <Focus className="w-3 h-3 text-cyan-400" />
                Center Stage
              </span>
            )}
            {isProNoiseSuppressionEnabled && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                <Mic2 className="w-3 h-3 text-emerald-400" />
                Pro Audio
              </span>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('enhancement')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'enhancement'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Appearance & Lighting</span>
          </button>
          <button
            onClick={() => setActiveTab('framing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'framing'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Focus className="w-3.5 h-3.5" />
            <span>Camera Framing (Center Stage)</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Noise Cancellation (Pro)</span>
          </button>
        </div>

        {/* Tab 1: Video Enhancements */}
        {activeTab === 'enhancement' && (
          <div className="space-y-4">
            {/* Touch Up My Appearance Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-100 block">
                      Touch Up My Appearance
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Subtle skin smoothing & warm tone radiance on your outgoing stream
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoAdjustments.touchUpAppearance}
                    onChange={(e) =>
                      updateVideoAdjustments({ touchUpAppearance: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              {videoAdjustments.touchUpAppearance && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Smoothing Intensity</span>
                    <span className="font-mono text-pink-400">
                      {videoAdjustments.touchUpIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={videoAdjustments.touchUpIntensity}
                    onChange={(e) =>
                      updateVideoAdjustments({ touchUpIntensity: Number(e.target.value) })
                    }
                    className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Color Adjustment Sliders */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-200">
                  Real-Time Color & Lighting
                </span>
                <button
                  onClick={handleResetColors}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-cyan-400 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Brightness
                  </span>
                  <span className="font-mono text-zinc-200">
                    {videoAdjustments.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={videoAdjustments.brightness}
                  onChange={(e) =>
                    updateVideoAdjustments({ brightness: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-cyan-400" />
                    Contrast
                  </span>
                  <span className="font-mono text-zinc-200">
                    {videoAdjustments.contrast}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={videoAdjustments.contrast}
                  onChange={(e) =>
                    updateVideoAdjustments({ contrast: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-indigo-400" />
                    Saturation
                  </span>
                  <span className="font-mono text-zinc-200">
                    {videoAdjustments.saturation}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={videoAdjustments.saturation}
                  onChange={(e) =>
                    updateVideoAdjustments({ saturation: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Camera Framing (Center Stage) */}
        {activeTab === 'framing' && (
          <div className="space-y-3">
            <span className="text-xs text-zinc-400 block">
              Choose how your camera frames your view:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Full Camera View Card */}
              <div
                onClick={() => updateVideoAdjustments({ framingMode: 'full' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                  videoAdjustments.framingMode === 'full'
                    ? 'border-cyan-400 bg-zinc-800/80 ring-2 ring-cyan-400/40'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Maximize className="w-5 h-5 text-zinc-300" />
                  {videoAdjustments.framingMode === 'full' && (
                    <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-xs text-zinc-100 block">
                    Full Camera View
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Standard wide uncropped 1.0x view showing your entire room.
                  </p>
                </div>
              </div>

              {/* Center Stage Card */}
              <div
                onClick={() => updateVideoAdjustments({ framingMode: 'center-stage' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                  videoAdjustments.framingMode === 'center-stage'
                    ? 'border-cyan-400 bg-zinc-800/80 ring-2 ring-cyan-400/40'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Focus className="w-5 h-5 text-cyan-400" />
                  {videoAdjustments.framingMode === 'center-stage' && (
                    <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-zinc-100">
                      Smart Auto-Focus
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      CENTER STAGE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Smoothly tracks and auto-crops to keep you dynamically centered in frame.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pro Noise Suppression */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-100 block">
                      Noise Suppression (Pro Studio)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Web Audio API voice isolation + dynamic compressor + low rumble filter
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProNoiseSuppressionEnabled}
                    onChange={toggleProNoiseSuppression}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                  <span className="font-semibold text-emerald-400 block">
                    85Hz High-Pass Filter
                  </span>
                  <span className="text-zinc-500">
                    Cuts AC hum, desk bumps, and fan rumble.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                  <span className="font-semibold text-emerald-400 block">
                    8000Hz Speech Isolation
                  </span>
                  <span className="text-zinc-500">
                    Filters out high-pitch hiss and keyboard clicks.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                  <span className="font-semibold text-emerald-400 block">
                    Dynamics Compressor
                  </span>
                  <span className="text-zinc-500">
                    Evens out speech volume and gates room echo.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                  <span className="font-semibold text-emerald-400 block">
                    Hardware Echo Cancellation
                  </span>
                  <span className="text-zinc-500">
                    Native browser echoCancellation and autoGainControl.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            Adjustments apply in real time to the outgoing WebRTC stream.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

