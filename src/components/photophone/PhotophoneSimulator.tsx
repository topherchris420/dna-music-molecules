import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WaveformCanvas } from "./WaveformCanvas";
import { LightBeam } from "./LightBeam";
import {
  Lightbulb,
  Volume2,
  Radio,
  Play,
  Square,
  Info,
  Mic,
  MicOff,
  Sun,
} from "lucide-react";
import * as Tone from "tone";
import { toast } from "sonner";

type AudioSource = "tone" | "mic";

export const PhotophoneSimulator = () => {
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [amplitude, setAmplitude] = useState(0.8);
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [noise, setNoise] = useState(0.05);
  const [distance, setDistance] = useState(5);
  const [historicalMode, setHistoricalMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>("tone");
  const [micActive, setMicActive] = useState(false);

  const oscillatorRef = useRef<Tone.Oscillator | null>(null);

  // Mic refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAmplitudeRef = useRef(0);
  const micRafRef = useRef<number | null>(null);

  // Continuously sample mic amplitude into a ref
  const updateMicAmplitude = useCallback(() => {
    if (!micAnalyserRef.current) return;
    const data = new Uint8Array(micAnalyserRef.current.fftSize);
    micAnalyserRef.current.getByteTimeDomainData(data);
    // RMS amplitude normalised to 0-1
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    micAmplitudeRef.current = Math.sqrt(sum / data.length) * 3; // boost for visibility
    micRafRef.current = requestAnimationFrame(updateMicAmplitude);
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      micStreamRef.current = stream;
      micContextRef.current = ctx;
      micAnalyserRef.current = analyser;
      setMicActive(true);
      setIsActive(true);
      setAudioSource("mic");
      updateMicAmplitude();
      toast.success("Microphone active — speak to modulate the light beam");
    } catch (err) {
      toast.error("Microphone access denied");
    }
  }, [updateMicAmplitude]);

  const stopMic = useCallback(() => {
    if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micContextRef.current?.close();
    micStreamRef.current = null;
    micContextRef.current = null;
    micAnalyserRef.current = null;
    micAmplitudeRef.current = 0;
    setMicActive(false);
    if (audioSource === "mic") setAudioSource("tone");
  }, [audioSource]);

  // ----- Signal math -----
  const audioSignal = useCallback(
    (t: number) => {
      if (!isActive) return 0;
      if (audioSource === "mic") {
        // Use live mic amplitude to drive a pseudo-waveform for visualisation
        const mic = micAmplitudeRef.current;
        return mic * Math.sin(2 * Math.PI * 220 * t); // carrier for visual only
      }
      return amplitude * Math.sin(2 * Math.PI * frequency * t);
    },
    [frequency, amplitude, isActive, audioSource]
  );

  const modulatedLightSignal = useCallback(
    (t: number) => {
      if (!isActive) return 0;
      const audio = audioSource === "mic"
        ? micAmplitudeRef.current * Math.sin(2 * Math.PI * 220 * t)
        : amplitude * Math.sin(2 * Math.PI * frequency * t);
      const attenuation = 1 / (1 + distance * 0.015);
      const noiseVal =
        noise *
        (Math.sin(t * 1337.7) * 0.5 +
          Math.sin(t * 2971.3) * 0.3 +
          Math.sin(t * 4519.1) * 0.2);
      return (lightIntensity * (1 + audio) / 2) * attenuation + noiseVal;
    },
    [amplitude, frequency, lightIntensity, distance, noise, isActive, audioSource]
  );

  const reconstructedSignal = useCallback(
    (t: number) => {
      if (!isActive) return 0;
      const received = modulatedLightSignal(t);
      const attenuation = 1 / (1 + distance * 0.015);
      const carrier = (lightIntensity * attenuation) / 2;
      if (carrier < 0.001) return 0;
      return (received - carrier) / carrier;
    },
    [modulatedLightSignal, lightIntensity, distance, isActive]
  );

  // ----- Tone.js audio playback -----
  const togglePlay = async () => {
    if (isPlaying) {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.dispose();
      oscillatorRef.current = null;
      setIsPlaying(false);
    } else {
      await Tone.start();
      const osc = new Tone.Oscillator(frequency, "sine").toDestination();
      osc.volume.value = -14;
      osc.start();
      oscillatorRef.current = osc;
      setIsPlaying(true);
      setIsActive(true);
      setAudioSource("tone");
    }
  };

  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = frequency;
    }
  }, [frequency]);

  useEffect(() => {
    return () => {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.dispose();
      stopMic();
    };
  }, []);
  const emitterColor = "hsl(var(--photophone-emitter))";
  const beamColor = "hsl(var(--photophone-beam))";
  const receiverColor = "hsl(var(--photophone-receiver))";

  return (
    <Card className="p-6 bg-card/60 border-border/40 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5" style={{ color: beamColor }} />
            <h3 className="text-xl font-serif" style={{ color: beamColor }}>
              Bell Labs Photophone Simulator
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on Henry Feinberg's 1978 demonstration — sound transmitted via light
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label
            htmlFor="historical"
            className="text-xs text-muted-foreground"
          >
            Historical Mode
          </Label>
          <Switch
            id="historical"
            checked={historicalMode}
            onCheckedChange={setHistoricalMode}
          />
          <Button
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => setIsActive(!isActive)}
            className="gap-1"
          >
            {isActive ? (
              <Square className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isActive ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      {/* Historical annotation banner */}
      {historicalMode && (
        <div className="bg-secondary/50 rounded-lg p-3 border border-border/30 flex items-start gap-2 text-xs text-muted-foreground animate-fade-in">
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: beamColor }} />
          <p>
            <strong className="text-foreground">Photophone (1880):</strong>{" "}
            Alexander Graham Bell invented the photophone, which transmitted
            speech on a beam of sunlight. In 1978, Henry Feinberg at Bell Labs
            demonstrated this principle using modern optics — a voice signal
            modulates a light beam's intensity, which is then decoded by a
            photodetector back into audible sound.
          </p>
        </div>
      )}

      {/* Transmission Path */}
      <div className="grid grid-cols-[100px_1fr_100px] md:grid-cols-[130px_1fr_130px] gap-2 items-center">
        {/* Transmitter */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: `hsl(var(--photophone-emitter) / 0.1)`,
              borderColor: `hsl(var(--photophone-emitter) / 0.3)`,
            }}
          >
            <Volume2 className="w-7 h-7" style={{ color: emitterColor }} />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Sound Source</p>
            <p className="text-[10px] text-muted-foreground">+ Light Emitter</p>
          </div>
          {historicalMode && (
            <p className="text-[10px] leading-tight animate-fade-in" style={{ color: emitterColor }}>
              A vibrating diaphragm modulates the intensity of a focused light beam
            </p>
          )}
        </div>

        {/* Light Beam */}
        <div className="space-y-1">
          <LightBeam
            signalFn={modulatedLightSignal}
            isActive={isActive}
            distance={distance}
            noise={noise}
          />
          {historicalMode && (
            <p className="text-[10px] text-center text-muted-foreground animate-fade-in">
              Amplitude-modulated light travels through free space — intensity encodes the audio waveform
            </p>
          )}
        </div>

        {/* Receiver */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: `hsl(var(--photophone-receiver) / 0.1)`,
              borderColor: `hsl(var(--photophone-receiver) / 0.3)`,
            }}
          >
            <Radio className="w-7 h-7" style={{ color: receiverColor }} />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Photodetector</p>
            <p className="text-[10px] text-muted-foreground">→ Speaker</p>
          </div>
          {historicalMode && (
            <p className="text-[10px] leading-tight animate-fade-in" style={{ color: receiverColor }}>
              Selenium cell converts light variations into an electrical current, driving a speaker
            </p>
          )}
        </div>
      </div>

      {/* Waveform Displays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <WaveformCanvas
            signalFn={audioSignal}
            color={emitterColor}
            label="ORIGINAL AUDIO"
            sublabel={`${frequency} Hz · ${(amplitude * 100).toFixed(0)}%`}
            isActive={isActive}
          />
          {historicalMode && (
            <p className="text-[10px] text-muted-foreground text-center animate-fade-in">
              The acoustic signal from a sound source (voice, tone generator)
            </p>
          )}
        </div>

        <div className="space-y-1">
          <WaveformCanvas
            signalFn={modulatedLightSignal}
            color={beamColor}
            label="MODULATED LIGHT"
            sublabel={`Intensity: ${(lightIntensity * 100).toFixed(0)}%`}
            isActive={isActive}
          />
          {historicalMode && (
            <p className="text-[10px] text-muted-foreground text-center animate-fade-in">
              Light intensity varies with the audio — AM (amplitude modulation) encoding
            </p>
          )}
        </div>

        <div className="space-y-1">
          <WaveformCanvas
            signalFn={reconstructedSignal}
            color={receiverColor}
            label="RECONSTRUCTED AUDIO"
            sublabel={`SNR loss from ${distance}m + noise`}
            isActive={isActive}
          />
          {historicalMode && (
            <p className="text-[10px] text-muted-foreground text-center animate-fade-in">
              The photodetector recovers the original audio — compare with the source
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
        {/* Audio Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2" style={{ color: emitterColor }}>
            <Mic className="w-3.5 h-3.5" />
            Audio Source
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-mono">{frequency} Hz</span>
            </div>
            <Slider
              value={[frequency]}
              onValueChange={([v]) => setFrequency(v)}
              min={60}
              max={2000}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Amplitude</span>
              <span className="font-mono">{(amplitude * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[amplitude]}
              onValueChange={([v]) => setAmplitude(v)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={togglePlay}
            className="gap-2 w-full"
          >
            {isPlaying ? (
              <Square className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
            {isPlaying ? "Stop Audio" : "Play Source Tone"}
          </Button>
        </div>

        {/* Light & Channel Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2" style={{ color: beamColor }}>
            <Lightbulb className="w-3.5 h-3.5" />
            Light Channel
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Light Intensity</span>
              <span className="font-mono">
                {(lightIntensity * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[lightIntensity]}
              onValueChange={([v]) => setLightIntensity(v)}
              min={0.1}
              max={1}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Noise / Interference</span>
              <span className="font-mono">{(noise * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[noise]}
              onValueChange={([v]) => setNoise(v)}
              min={0}
              max={0.5}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Distance</span>
              <span className="font-mono">{distance} m</span>
            </div>
            <Slider
              value={[distance]}
              onValueChange={([v]) => setDistance(v)}
              min={1}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Simulation Active" : "Simulation Idle"}
        </Badge>
        <Badge variant="outline" className="font-mono text-xs">
          {frequency} Hz
        </Badge>
        <Badge variant="outline" className="font-mono text-xs">
          {distance}m path
        </Badge>
        {noise > 0.15 && (
          <Badge variant="destructive" className="text-xs">
            High Noise
          </Badge>
        )}
      </div>
    </Card>
  );
};
