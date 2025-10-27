import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, Mic } from "lucide-react";
import { toast } from "sonner";

interface BiofeedbackInputProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onBiofeedback: (modulation: number) => void; // 0 to 1
}

export const BiofeedbackInput = ({ enabled, onToggle, onBiofeedback }: BiofeedbackInputProps) => {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const startBiofeedback = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const analyze = () => {
          if (!analyserRef.current || !enabled) return;

          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS amplitude
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          
          setAmplitude(rms);
          onBiofeedback(Math.min(rms * 3, 1)); // Amplify and clamp

          animationRef.current = requestAnimationFrame(analyze);
        };

        analyze();
        toast.success("Biofeedback active — your presence shapes the sound");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Could not access microphone");
        onToggle(false);
      }
    };

    startBiofeedback();

    return cleanup;
  }, [enabled, onBiofeedback, onToggle]);

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAmplitude(0);
  };

  return (
    <Card className="p-4 sm:p-6 bg-card/20 border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <Label className="text-sm sm:text-base font-medium">Biofeedback Loop</Label>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Your voice and presence modulate the tonal mix
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <div className="space-y-3 pt-4 mt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${amplitude * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            Listening to your environment... speak, breathe, or make sounds to influence the harmony
          </div>
        </div>
      )}
    </Card>
  );
};
