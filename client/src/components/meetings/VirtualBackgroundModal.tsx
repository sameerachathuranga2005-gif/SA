import React, { useRef, useEffect, useState } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import {
  VIRTUAL_BACKGROUND_PRESETS,
  VirtualBackgroundType,
} from '../../services/videoFilters';
import { Sparkles, X, Check, Image as ImageIcon, Sliders } from 'lucide-react';

interface VirtualBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VirtualBackgroundModal: React.FC<VirtualBackgroundModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { localStream, virtualBg, setVirtualBg, isVideoOff } = useMeetingStore();
  const { showToast } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'blur' | 'chroma' | 'interior' | 'scenic'>('all');

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen, virtualBg]);

  if (!isOpen) return null;

  const currentPreset =
    VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === virtualBg) ||
    VIRTUAL_BACKGROUND_PRESETS[0];

  const handleSelect = (id: VirtualBackgroundType) => {
    setVirtualBg(id);
    const selected = VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === id);
    showToast(`Applied: ${selected?.label}`, 'success');
  };

  const filteredPresets = VIRTUAL_BACKGROUND_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Virtual Backgrounds & Studio Screens</h3>
              <p className="text-xs text-zinc-400">Blur your room, switch to Blue/Green Screen, or choose scenic backdrops</p>
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
          {/* Virtual Background Image Layer */}
          {currentPreset.type === 'image' && currentPreset.imageUrl && (
            <img
              src={currentPreset.imageUrl}
              alt="Virtual Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Solid Chroma Blue / Green Screen Layer */}
          {currentPreset.type === 'color' && currentPreset.bgColor && (
            <div
              style={{ backgroundColor: currentPreset.bgColor }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-white/50">
                {currentPreset.label} Mode Active
              </span>
            </div>
          )}

          {/* Video Stream with optional Blur Filter */}
          {!isVideoOff && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                filter: currentPreset.cssFilter || undefined,
                opacity: currentPreset.type === 'image' || currentPreset.type === 'color' ? 0.92 : 1,
              }}
              className="relative z-10 w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="relative z-10 text-xs text-zinc-400">
              Camera is turned off
            </div>
          )}

          {/* Active Preset Watermark */}
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-[11px] font-semibold text-cyan-300 border border-zinc-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active: {currentPreset.label}</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/80">
          {[
            { id: 'all', label: 'All Presets' },
            { id: 'blur', label: 'Blur Effects' },
            { id: 'chroma', label: 'Blue / Green Screens' },
            { id: 'interior', label: 'Office & Interiors' },
            { id: 'scenic', label: 'Scenic & Space' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const isSelected = virtualBg === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all aspect-video flex flex-col justify-end p-1.5 ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                    : 'border-zinc-800 hover:border-zinc-700 hover:scale-[1.02]'
                }`}
              >
                {/* Background Representation */}
                {preset.type === 'image' && preset.previewUrl ? (
                  <img
                    src={preset.previewUrl}
                    alt={preset.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : preset.type === 'color' && preset.bgColor ? (
                  <div
                    style={{ backgroundColor: preset.bgColor }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center font-bold font-mono text-[9px] text-white/70"
                  >
                    {preset.id === 'studio-blue' ? 'BLUE' : 'GREEN'}
                  </div>
                ) : preset.type === 'blur' ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-zinc-900 to-zinc-950 backdrop-blur-md flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-cyan-400 opacity-60" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-zinc-600" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/20 to-transparent" />

                <span className="relative z-10 text-[10px] font-semibold text-zinc-100 truncate">
                  {preset.label}
                </span>

                {isSelected && (
                  <div className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            Real-time filter applied directly to your webcam stream.
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
