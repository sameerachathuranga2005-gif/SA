import React, { useRef, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import {
  VIRTUAL_BACKGROUND_PRESETS,
  VirtualBackgroundType,
} from '../../services/videoFilters';
import { Sparkles, X, Check, Sliders, Upload, Ban } from 'lucide-react';

interface VirtualBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VirtualBackgroundModal: React.FC<VirtualBackgroundModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { localStream, virtualBg, customBgUrl, setVirtualBg, isVideoOff } = useMeetingStore();
  const { showToast } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen, virtualBg]);

  if (!isOpen) return null;

  const handleSelect = (id: VirtualBackgroundType, customUrl?: string) => {
    setVirtualBg(id, customUrl);
    const selected = VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === id);
    const label = id === 'custom' ? 'Custom Uploaded Background' : selected?.label || id;
    showToast(`Applied: ${label}`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSelect('custom', dataUrl);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  const blurPresets = VIRTUAL_BACKGROUND_PRESETS.filter((p) => p.category === 'blur');
  const imagePresets = VIRTUAL_BACKGROUND_PRESETS.filter(
    (p) => p.category === 'interior' || p.category === 'scenic'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">
                Virtual Backgrounds & AI Person Blur
              </h3>
              <p className="text-xs text-zinc-400">
                Real-time segmentation isolates you from your background with smooth edge feathering
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
        <div className="relative w-full aspect-video max-h-56 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner mx-auto">
          {!isVideoOff && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="relative z-10 w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="relative z-10 text-xs text-zinc-500 flex flex-col items-center gap-1.5">
              <Ban className="w-6 h-6 text-zinc-600" />
              <span>Camera is currently off</span>
            </div>
          )}

          {/* Active Preset Watermark */}
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-[11px] font-semibold text-cyan-300 border border-zinc-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Active:{' '}
              {virtualBg === 'custom'
                ? 'Custom Upload'
                : VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === virtualBg)?.label || 'None'}
            </span>
          </div>
        </div>

        {/* Section 1: Blur & None Modes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Camera & Blur Modes
            </h4>
            <span className="text-[11px] text-zinc-500">Separates user and blurs background</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* None / Original */}
            <div
              onClick={() => handleSelect('none')}
              className={`group relative rounded-xl p-3 border cursor-pointer transition-all flex flex-col items-center justify-center gap-2 aspect-[16/9] ${
                virtualBg === 'none'
                  ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-zinc-800/80'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/40'
              }`}
            >
              <Ban className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200" />
              <span className="text-xs font-semibold text-zinc-200">None (Original)</span>
              {virtualBg === 'none' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Blur Options */}
            {blurPresets.map((preset) => {
              const isSelected = virtualBg === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className={`group relative rounded-xl p-3 border cursor-pointer transition-all flex flex-col items-center justify-center gap-2 aspect-[16/9] ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-zinc-800/80'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <Sliders className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-zinc-200">{preset.label}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Virtual Backgrounds & Custom Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Virtual Backgrounds
            </h4>
            <span className="text-[11px] text-zinc-500">Realistic environments + custom image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
            {/* Custom Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all aspect-video flex flex-col items-center justify-center p-2 border-dashed ${
                virtualBg === 'custom'
                  ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-zinc-800/90'
                  : 'border-zinc-700 hover:border-cyan-500 bg-zinc-950/60 hover:bg-zinc-800/50'
              }`}
            >
              {customBgUrl ? (
                <>
                  <img
                    src={customBgUrl}
                    alt="Custom Upload"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-zinc-950/50 flex flex-col items-center justify-center gap-1 z-10">
                    <Upload className="w-4 h-4 text-cyan-300" />
                    <span className="text-[10px] font-bold text-white">Custom Upload</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-200">Upload Image</span>
                </div>
              )}

              {virtualBg === 'custom' && (
                <div className="absolute top-2 right-2 z-20 w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Curated Preset Backgrounds */}
            {imagePresets.map((preset) => {
              const isSelected = virtualBg === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all aspect-video flex flex-col justify-end p-2 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg scale-[1.02]'
                      : 'border-zinc-800 hover:border-zinc-700 hover:scale-[1.01]'
                  }`}
                >
                  {preset.previewUrl && (
                    <img
                      src={preset.previewUrl}
                      alt={preset.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />

                  <span className="relative z-10 text-[11px] font-semibold text-zinc-100 truncate drop-shadow">
                    {preset.label}
                  </span>

                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-400">
            Powered by MediaPipe AI Segmentation with zero latency GPU acceleration.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
