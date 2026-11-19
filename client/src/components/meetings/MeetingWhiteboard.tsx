import React, { useRef, useState, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  Square,
  Circle,
  ArrowRight,
  Minus,
  RotateCcw,
  Trash2,
  Download,
  X,
  Grid,
  MousePointer,
} from 'lucide-react';

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface StickyNoteElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser' | 'text' | 'rect' | 'circle' | 'arrow' | 'line' | 'laser';
type GridStyle = 'dots' | 'graph' | 'blank';

export const MeetingWhiteboard: React.FC = () => {
  const { isWhiteboardOpen, toggleWhiteboard } = useMeetingStore();
  const { showToast } = useAppStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState('#6366f1'); // Indigo default
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize] = useState(24);
  const [gridStyle, setGridStyle] = useState<GridStyle>('dots');

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [tempImageData, setTempImageData] = useState<ImageData | null>(null);

  // Interactive Elements
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteElement[]>([]);

  // Laser Pointer Trail
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number; time: number }[]>([]);

  // Setup canvas resolution and redraw grid
  useEffect(() => {
    if (!isWhiteboardOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 1200;
    canvas.height = canvas.parentElement?.clientHeight || 750;

    renderGrid(ctx, canvas.width, canvas.height, gridStyle);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [isWhiteboardOpen]);

  // Redraw when grid style changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Restore last drawing or redraw
    if (history.length > 0) {
      ctx.putImageData(history[history.length - 1], 0, 0);
    } else {
      renderGrid(ctx, canvas.width, canvas.height, gridStyle);
    }
  }, [gridStyle]);

  // Clean laser pointer trail with animation loop
  useEffect(() => {
    if (tool !== 'laser') {
      setLaserTrail([]);
      return;
    }
    const interval = setInterval(() => {
      setLaserTrail((prev) => prev.filter((p) => Date.now() - p.time < 500));
    }, 50);
    return () => clearInterval(interval);
  }, [tool]);

  if (!isWhiteboardOpen) return null;

  const renderGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: GridStyle
  ) => {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    if (style === 'dots') {
      ctx.fillStyle = '#27272a';
      const gap = 24;
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'graph') {
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      const gap = 30;
      for (let x = 0; x < width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startAction = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'text') {
      // Spawn text element at click coordinates
      const newText: TextElement = {
        id: `text-${Date.now()}`,
        x,
        y,
        text: 'Type your thoughts here...',
        color,
        fontSize,
      };
      setTextElements([...textElements, newText]);
      return;
    }

    if (tool === 'laser') {
      setLaserTrail([{ x, y, time: Date.now() }]);
      setIsDrawing(true);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });

    // Save state before starting shape preview
    setTempImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const performAction = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'laser') {
      setLaserTrail((prev) => [...prev.slice(-20), { x, y, time: Date.now() }]);
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color + '55'; // semi-transparent
      ctx.lineWidth = 22;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 28;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (startPos && tempImageData) {
      // Restore previous state for live shape preview
      ctx.putImageData(tempImageData, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'rect') {
        const w = x - startPos.x;
        const h = y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        // Draw line with arrowhead
        const headLength = 16;
        const angle = Math.atan2(y - startPos.y, x - startPos.x);
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.lineTo(
          x - headLength * Math.cos(angle - Math.PI / 6),
          y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLength * Math.cos(angle + Math.PI / 6),
          y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  };

  const stopAction = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStartPos(null);
    setTempImageData(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    // Save to history stack for undo
    setHistory((prev) => [
      ...prev.slice(-20),
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    ]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGrid(ctx, canvas.width, canvas.height, gridStyle);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    setTextElements([]);
    setStickyNotes([]);
    showToast('Whiteboard canvas cleared', 'info');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Zoom-Whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showToast('Saved Whiteboard as High-Resolution PNG!', 'success');
  };

  const handleAddSticky = (colorHex: string) => {
    const newNote: StickyNoteElement = {
      id: `sticky-${Date.now()}`,
      x: 100 + Math.random() * 250,
      y: 100 + Math.random() * 180,
      text: 'Click here to write notes...',
      color: colorHex,
    };
    setStickyNotes([...stickyNotes, newNote]);
    showToast('Added Sticky Note to Whiteboard', 'success');
  };

  const colors = [
    '#ffffff',
    '#6366f1',
    '#10b981',
    '#38bdf8',
    '#f59e0b',
    '#f43f5e',
    '#ec4899',
    '#a855f7',
  ];

  return (
    <div className="absolute inset-0 z-30 bg-[#09090b] flex flex-col animate-fade-in select-none">
      {/* Top Professional Whiteboard Toolbar */}
      <div className="h-16 px-4 md:px-6 bg-zinc-950/95 border-b border-zinc-800 flex items-center justify-between shrink-0 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Main Drawing Tools Group */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'pen' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Pen (Smooth Handwriting)"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'highlighter' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Text (Click anywhere to write typography)"
            >
              <Type className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'eraser' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('laser')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'laser' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-red-400'
              }`}
              title="Presentation Laser Pointer (Fading Trail)"
            >
              <MousePointer className="w-4 h-4" />
            </button>
          </div>

          {/* Shapes Group */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 hidden sm:flex">
            <button
              onClick={() => setTool('rect')}
              className={`p-1.5 rounded-lg transition-all ${
                tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded-lg transition-all ${
                tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Circle / Ellipse"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`p-1.5 rounded-lg transition-all ${
                tool === 'arrow' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Arrow"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-1.5 rounded-lg transition-all ${
                tool === 'line' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Straight Line"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110 opacity-70'
                }`}
              />
            ))}
          </div>

          {/* Stroke Width or Font Size */}
          <div className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
            <span>Size:</span>
            {[2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setLineWidth(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  lineWidth === s ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                {s}px
              </button>
            ))}
          </div>

          {/* Grid Pattern Toggle (Dots, Graph, Blank) */}
          <button
            onClick={() => {
              const next: GridStyle =
                gridStyle === 'dots' ? 'graph' : gridStyle === 'graph' ? 'blank' : 'dots';
              setGridStyle(next);
              showToast(`Grid: ${next.toUpperCase()}`, 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
            title="Toggle Background Grid (Dots, Graph, Blank)"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize">{gridStyle}</span>
          </button>

          {/* Add Sticky Note */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {[
              { color: '#fef08a', name: 'Yellow' },
              { color: '#bbf7d0', name: 'Green' },
              { color: '#bae6fd', name: 'Blue' },
              { color: '#fbcfe8', name: 'Pink' },
            ].map((sticky) => (
              <button
                key={sticky.color}
                onClick={() => handleAddSticky(sticky.color)}
                style={{ backgroundColor: sticky.color }}
                className="w-5 h-5 rounded-md hover:scale-110 transition-transform shadow-sm"
                title={`Add ${sticky.name} Sticky Note`}
              />
            ))}
          </div>
        </div>

        {/* Right Actions: Undo, Clear, Save, Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
            title="Clear Entire Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
            title="Download Whiteboard image"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export</span>
          </button>

          <button
            onClick={toggleWhiteboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Stage Area */}
      <div className="flex-1 relative overflow-hidden bg-[#09090b]">
        <canvas
          ref={canvasRef}
          onPointerDown={startAction}
          onPointerMove={performAction}
          onPointerUp={stopAction}
          onPointerLeave={stopAction}
          className={`w-full h-full block touch-none ${
            tool === 'text' ? 'cursor-text' : tool === 'laser' ? 'cursor-none' : 'cursor-crosshair'
          }`}
        />

        {/* Laser Pointer Trail Dots */}
        {laserTrail.map((p, idx) => (
          <div
            key={idx}
            style={{ left: p.x - 6, top: p.y - 6 }}
            className="absolute w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/80 pointer-events-none transition-opacity duration-300 animate-ping"
          />
        ))}

        {/* Live Typography Text Elements */}
        {textElements.map((item) => (
          <div
            key={item.id}
            style={{ left: item.x, top: item.y }}
            className="absolute group z-20"
          >
            <textarea
              defaultValue={item.text}
              style={{
                color: item.color,
                fontSize: `${item.fontSize}px`,
              }}
              rows={2}
              className="bg-transparent border border-dashed border-zinc-700/60 focus:border-cyan-400 rounded-lg p-2 font-sans font-medium resize focus:outline-none backdrop-blur-xs min-w-[200px]"
            />
            <button
              onClick={() => setTextElements(textElements.filter((t) => t.id !== item.id))}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-800 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Sticky Notes */}
        {stickyNotes.map((note) => (
          <div
            key={note.id}
            style={{ left: note.x, top: note.y, backgroundColor: note.color }}
            className="absolute p-3 rounded-2xl shadow-2xl text-zinc-950 text-xs w-48 min-h-[110px] border border-black/10 flex flex-col justify-between cursor-move z-20 group"
          >
            <textarea
              defaultValue={note.text}
              className="bg-transparent border-none text-xs font-semibold text-zinc-950 resize-none focus:outline-none w-full leading-relaxed"
              rows={3}
            />
            <div className="flex items-center justify-between pt-1 border-t border-black/10 text-[10px] font-bold text-zinc-700">
              <span className="font-mono">Sticky Note</span>
              <button
                onClick={() => setStickyNotes(stickyNotes.filter((n) => n.id !== note.id))}
                className="text-red-700 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
