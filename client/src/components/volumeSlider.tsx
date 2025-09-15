"use client";
import { Volume2Icon, VolumeXIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VolumeSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  onMute: () => void;
  className?: string;
}
export function VolumeSlider({
  value,
  onValueChange,
  onMute,
  className,
}: VolumeSliderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="leading-6">Volume</Label>
        <output className="text-sm font-medium tabular-nums">{value}</output>
      </div>
      <div className="flex items-center gap-2">
        <VolumeXIcon
          onClick={onMute}
          className="shrink-0 opacity-60"
          size={16}
          aria-hidden="true"
        />
        <Slider
          value={value}
          onValueChange={onValueChange}
          aria-label="Volume slider"
        />
        <Volume2Icon
          className="shrink-0 opacity-60"
          size={16}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
