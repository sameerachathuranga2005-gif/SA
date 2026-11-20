import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';

export type BackgroundMode = 'none' | 'blur-soft' | 'blur-strong' | 'image';

export interface BackgroundSettings {
  mode: BackgroundMode;
  imageUrl?: string;
}

export interface IVideoAdjustments {
  touchUpAppearance: boolean;
  touchUpIntensity: number; // 0 - 100
  brightness: number; // 50 - 150
  contrast: number; // 50 - 150
  saturation: number; // 50 - 150
  framingMode: 'full' | 'center-stage';
}

export const DEFAULT_VIDEO_ADJUSTMENTS: IVideoAdjustments = {
  touchUpAppearance: false,
  touchUpIntensity: 45,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  framingMode: 'full',
};

class VideoProcessorService {
  private selfieSegmentation: SelfieSegmentation | null = null;
  private isModelLoaded = false;
  private isProcessing = false;
  private animationFrameId: number | null = null;

  private sourceStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private currentSettings: BackgroundSettings = { mode: 'none' };
  private adjustments: IVideoAdjustments = { ...DEFAULT_VIDEO_ADJUSTMENTS };
  private bgImage: HTMLImageElement | null = null;
  private outputStream: MediaStream | null = null;
  private processedVideoTrack: MediaStreamTrack | null = null;

  // Center Stage Auto-Framing Crop coordinates with smooth interpolation (lerp)
  private currentCrop = { x: 0, y: 0, w: 1280, h: 720 };
  private targetCrop = { x: 0, y: 0, w: 1280, h: 720 };

  constructor() {
    this.initCanvas();
  }

  private initCanvas() {
    if (typeof document === 'undefined') return;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
  }

  public async initModel(): Promise<void> {
    if (this.selfieSegmentation) return;

    try {
      this.selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      this.selfieSegmentation.setOptions({
        modelSelection: 1, // 1 for landscape/full frame (ideal for meeting webcams)
        selfieMode: false, // Keep natural stream orientation, UI mirrors preview
      });

      this.selfieSegmentation.onResults((results: Results) => {
        this.renderFrame(results);
      });

      await this.selfieSegmentation.initialize();
      this.isModelLoaded = true;
      console.log('[VideoProcessor] MediaPipe Selfie Segmentation initialized');
    } catch (err) {
      console.warn('[VideoProcessor] Could not load MediaPipe model, falling back to direct video:', err);
      this.isModelLoaded = false;
    }
  }

  // Set or update raw camera stream
  public async setSourceStream(stream: MediaStream | null): Promise<MediaStream | null> {
    this.sourceStream = stream;

    if (!stream || stream.getVideoTracks().length === 0) {
      this.stop();
      return null;
    }

    if (!this.videoElement || !this.canvas) {
      this.initCanvas();
    }

    if (this.videoElement) {
      this.videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play().catch(() => {});
          if (this.canvas && this.videoElement) {
            const w = this.videoElement.videoWidth || 1280;
            const h = this.videoElement.videoHeight || 720;
            this.canvas.width = w;
            this.canvas.height = h;
            this.currentCrop = { x: 0, y: 0, w, h };
            this.targetCrop = { x: 0, y: 0, w, h };
          }
          resolve();
        };
      });
    }

    // Start rendering loop
    this.startProcessing();

    // Create persistent canvas output stream
    if (this.canvas) {
      const canvasStream = this.canvas.captureStream(30);
      this.processedVideoTrack = canvasStream.getVideoTracks()[0] || null;

      this.outputStream = new MediaStream();
      if (this.processedVideoTrack) {
        this.outputStream.addTrack(this.processedVideoTrack);
      }
      // Pass along raw audio tracks
      stream.getAudioTracks().forEach((track) => {
        this.outputStream?.addTrack(track);
      });

      return this.outputStream;
    }

    return stream;
  }

  // Update background settings (none, blur-soft, blur-strong, image)
  public async updateSettings(settings: BackgroundSettings) {
    this.currentSettings = settings;

    if (settings.mode === 'image' && settings.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = settings.imageUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          this.bgImage = img;
          resolve();
        };
        img.onerror = () => {
          console.warn('[VideoProcessor] Failed to load background image:', settings.imageUrl);
          this.bgImage = null;
          resolve();
        };
      });
    } else {
      this.bgImage = null;
    }

    // Automatically load model if blur, virtual background, or center stage is requested
    if (
      (settings.mode !== 'none' || this.adjustments.framingMode === 'center-stage') &&
      !this.isModelLoaded
    ) {
      await this.initModel();
    }
  }

  // Update video appearance adjustments
  public setAdjustments(newAdjustments: Partial<IVideoAdjustments>) {
    this.adjustments = { ...this.adjustments, ...newAdjustments };
    if (this.adjustments.framingMode === 'center-stage' && !this.isModelLoaded) {
      this.initModel().catch(() => {});
    }
  }

  public getAdjustments(): IVideoAdjustments {
    return { ...this.adjustments };
  }

  private startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const loop = async () => {
      if (!this.isProcessing) return;

      if (
        this.videoElement &&
        this.videoElement.readyState >= 2 &&
        !this.videoElement.paused
      ) {
        const needsSegmentation =
          this.currentSettings.mode !== 'none' ||
          this.adjustments.framingMode === 'center-stage';

        if (!needsSegmentation || !this.isModelLoaded || !this.selfieSegmentation) {
          // Direct camera rendering when mode is none and not center stage
          this.renderDirect();
        } else {
          try {
            await this.selfieSegmentation.send({ image: this.videoElement });
          } catch (_e) {
            this.renderDirect();
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  // Direct camera render with color adjustments and optional center crop
  private renderDirect() {
    if (!this.ctx || !this.canvas || !this.videoElement) return;
    const { width, height } = this.canvas;
    const { brightness, contrast, saturation } = this.adjustments;

    this.updateFramingTargets(width, height);

    this.ctx.save();
    this.ctx.clearRect(0, 0, width, height);

    // Color Correction Filter
    this.ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Draw video using interpolated framing crop
    this.ctx.drawImage(
      this.videoElement,
      this.currentCrop.x,
      this.currentCrop.y,
      this.currentCrop.w,
      this.currentCrop.h,
      0,
      0,
      width,
      height
    );

    // Apply Touch Up Skin Smoothing / Radiance if enabled
    this.applyTouchUp(width, height);

    this.ctx.restore();
  }

  // Render segmentation with foreground person + smooth feathering + background blur or image + color adjustments
  private renderFrame(results: Results) {
    if (!this.ctx || !this.canvas) return;
    const { width, height } = this.canvas;
    const { mode } = this.currentSettings;
    const { brightness, contrast, saturation } = this.adjustments;

    this.updateFramingTargets(width, height);

    this.ctx.save();
    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw segmentation mask with smooth edge feathering (2.5px blur on the mask)
    this.ctx.filter = 'blur(2.5px)';
    this.ctx.drawImage(
      results.segmentationMask,
      this.currentCrop.x,
      this.currentCrop.y,
      this.currentCrop.w,
      this.currentCrop.h,
      0,
      0,
      width,
      height
    );
    this.ctx.filter = 'none';

    // 2. Composite foreground person: only keep pixels inside the mask
    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    this.ctx.drawImage(
      results.image,
      this.currentCrop.x,
      this.currentCrop.y,
      this.currentCrop.w,
      this.currentCrop.h,
      0,
      0,
      width,
      height
    );
    this.ctx.filter = 'none';

    // 3. Draw background behind the person
    this.ctx.globalCompositeOperation = 'destination-over';

    if (mode === 'blur-soft') {
      // Gaussian Blur 12px for Soft Blur
      this.ctx.filter = `blur(12px) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      this.ctx.drawImage(
        results.image,
        this.currentCrop.x,
        this.currentCrop.y,
        this.currentCrop.w,
        this.currentCrop.h,
        0,
        0,
        width,
        height
      );
      this.ctx.filter = 'none';
    } else if (mode === 'blur-strong') {
      // Gaussian Blur 20px for Strong Blur
      this.ctx.filter = `blur(20px) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      this.ctx.drawImage(
        results.image,
        this.currentCrop.x,
        this.currentCrop.y,
        this.currentCrop.w,
        this.currentCrop.h,
        0,
        0,
        width,
        height
      );
      this.ctx.filter = 'none';
    } else if (mode === 'image' && this.bgImage) {
      // Draw Virtual Background image with aspect-ratio cover
      const imgRatio = this.bgImage.width / this.bgImage.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      } else {
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      }

      this.ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
    } else {
      this.ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      this.ctx.drawImage(
        results.image,
        this.currentCrop.x,
        this.currentCrop.y,
        this.currentCrop.w,
        this.currentCrop.h,
        0,
        0,
        width,
        height
      );
      this.ctx.filter = 'none';
    }

    // 4. Apply Touch Up My Appearance skin radiance
    this.applyTouchUp(width, height);

    this.ctx.restore();
  }

  // Calculate smooth camera framing interpolation
  private updateFramingTargets(width: number, height: number) {
    if (this.adjustments.framingMode === 'center-stage') {
      // Zoom 1.32x centered on the speaker's upper chest / head
      const zoom = 1.32;
      const targetW = width / zoom;
      const targetH = height / zoom;
      const targetX = (width - targetW) / 2;
      const targetY = (height - targetH) * 0.35; // Position slightly higher to frame head nicely

      this.targetCrop = { x: targetX, y: targetY, w: targetW, h: targetH };
    } else {
      // Full Camera View: uncropped 1.0x wide view
      this.targetCrop = { x: 0, y: 0, w: width, h: height };
    }

    // Smooth lerp interpolation (0.08 per frame gives natural cinematic transition)
    const lerp = 0.08;
    this.currentCrop.x += (this.targetCrop.x - this.currentCrop.x) * lerp;
    this.currentCrop.y += (this.targetCrop.y - this.currentCrop.y) * lerp;
    this.currentCrop.w += (this.targetCrop.w - this.currentCrop.w) * lerp;
    this.currentCrop.h += (this.targetCrop.h - this.currentCrop.h) * lerp;
  }

  // Subtle warm radiance & skin smoothing overlay for "Touch Up My Appearance"
  private applyTouchUp(width: number, height: number) {
    if (!this.ctx || !this.adjustments.touchUpAppearance) return;

    const intensity = this.adjustments.touchUpIntensity / 100;
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'soft-light';
    this.ctx.fillStyle = `rgba(255, 235, 220, ${0.12 + intensity * 0.24})`;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();
  }

  public getOutputVideoTrack(): MediaStreamTrack | null {
    if (this.processedVideoTrack && this.processedVideoTrack.readyState === 'live') {
      return this.processedVideoTrack;
    }
    return this.sourceStream?.getVideoTracks()[0] || null;
  }

  public getOutputStream(): MediaStream | null {
    return this.outputStream || this.sourceStream;
  }

  public stop() {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}

export const videoProcessor = new VideoProcessorService();
