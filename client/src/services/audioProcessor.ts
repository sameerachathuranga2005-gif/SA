class AudioProcessorService {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  private isProNoiseSuppression = true;
  private rawStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;

  public init(rawStream: MediaStream): MediaStreamTrack | null {
    this.rawStream = rawStream;
    const rawTrack = rawStream.getAudioTracks()[0];
    if (!rawTrack) return null;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return rawTrack;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(rawStream);

      // 1. High-Pass Filter: Cuts desk rumble, fan, and air conditioner vibrations (<85 Hz)
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.setValueAtTime(85, this.audioCtx.currentTime);
      this.highpassFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

      // 2. Low-Pass Filter: Speech band isolation to cut high-frequency background noise (>8000 Hz)
      this.lowpassFilter = this.audioCtx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.setValueAtTime(8000, this.audioCtx.currentTime);
      this.lowpassFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

      // 3. Dynamics Compressor: Smooths vocal peaks and suppresses background ambient hiss
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

      // Destination stream
      this.destinationNode = this.audioCtx.createMediaStreamDestination();

      if (this.isProNoiseSuppression) {
        this.sourceNode.connect(this.highpassFilter);
        this.highpassFilter.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.compressor);
        this.compressor.connect(this.destinationNode);
      } else {
        this.sourceNode.connect(this.destinationNode);
      }

      this.processedStream = this.destinationNode.stream;
      return this.processedStream.getAudioTracks()[0] || rawTrack;
    } catch (err) {
      console.warn('[AudioProcessor] Web Audio API init failed, using raw audio track:', err);
      return rawTrack;
    }
  }

  public setProNoiseSuppression(enabled: boolean): MediaStreamTrack | null {
    this.isProNoiseSuppression = enabled;
    if (!this.sourceNode || !this.destinationNode || !this.highpassFilter || !this.lowpassFilter || !this.compressor) {
      return this.rawStream?.getAudioTracks()[0] || null;
    }

    try {
      this.sourceNode.disconnect();
      this.highpassFilter.disconnect();
      this.lowpassFilter.disconnect();
      this.compressor.disconnect();

      if (enabled) {
        this.sourceNode.connect(this.highpassFilter);
        this.highpassFilter.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.compressor);
        this.compressor.connect(this.destinationNode);
      } else {
        this.sourceNode.connect(this.destinationNode);
      }

      return this.destinationNode.stream.getAudioTracks()[0] || null;
    } catch (err) {
      console.error('[AudioProcessor] Error toggling noise suppression:', err);
      return this.rawStream?.getAudioTracks()[0] || null;
    }
  }

  public isEnabled(): boolean {
    return this.isProNoiseSuppression;
  }
}

export const audioProcessor = new AudioProcessorService();

