"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  LucidePause,
  LucidePlay,
  LucideSkipBack,
  LucideSkipForward,
  LucideVolume2,
  LucideVolumeX,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion as m } from "motion/react";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { SearchPopup } from "./searchPopup";

interface YoutubePlayerProps {
  track?: YOUTUBE_DATA;
  onPrev?: () => void;
  onNext?: () => void;
  onSelectTrack: (track: YOUTUBE_DATA) => void;
}

const YoutubePlayer = ({
  track,
  onPrev,
  onNext,
  onSelectTrack,
}: YoutubePlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.25);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAudio = (videoId: string) => {
    if (!videoId) {
      setIsLoaded(false);
      toast.error("No video ID found");
      return;
    }

    const audioUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${videoId}`;
    if (audioRef.current) {
      setIsLoaded(false);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  };

  const handlePlay = () => {
    if (!isLoaded || !audioRef.current) return;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => toast.error("Error playing audio (autoplay blocked?)"));
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setVolume(audioRef.current.muted ? 0 : audioRef.current.volume);
    }
  };

  useEffect(() => {
    if (track) loadAudio(track?.YT_VIDEO_ID);
  }, [track?.YT_VIDEO_ID]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };
    audioRef.current?.addEventListener("timeupdate", updateProgress);
    return () =>
      audioRef.current?.removeEventListener("timeupdate", updateProgress);
  }, []);

  return (
    <div className="p-2 bg-white/10 backdrop-blur-lg w-full flex sm:flex-row flex-col font-Poppins rounded-xl sm:justify-between sm:items-center items-center relative">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={onNext}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(false);
          toast.error("Error loading audio");
        }}
      />

      {/* Track Info */}
      <div className="hidden gap-2 sm:flex">
        <img
          src="/apple-touch-icon.png"
          alt="album-img"
          className="size-20 rounded-lg"
        />
        {/* <div className="size-20 rounded-lg bg-zinc-700 flex items-center justify-center text-xs text-neutral-300">
                    YT
                </div> */}
        <div className="flex flex-col">
          <m.h1
            key={track?.YT_VIDEO_ID}
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.35 }}
            className="text-sm font-semibold text-white"
          >
            {track?.YT_TITLE || "Unknown Video"}
          </m.h1>
          <span className="text-neutral-400 text-xs">YouTube</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col-reverse sm:flex-col items-center gap-2 w-full sm:w-1/3 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="flex gap-1 md:gap-2 justify-center sm:justify-start">
          <Button onClick={onPrev} disabled={!onPrev}>
            <LucideSkipBack />
          </Button>
          <Button
            variant="default"
            onClick={playing ? handlePause : handlePlay}
            disabled={!isLoaded}
          >
            {playing ? (
              <LucidePause className="w-4 h-4" />
            ) : (
              <LucidePlay className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={onNext} disabled={!onNext}>
            <LucideSkipForward />
          </Button>
        </div>

        {/* ProgressBar */}
        <div className="relative mt-2 w-full lg:h-2 h-3 bg-gray-700 rounded-full">
          <m.div
            className="absolute top-0 left-0 lg:h-2 h-3 bg-[#ccff00] rounded-full"
            animate={{
              width: `${(progress / (audioRef.current?.duration || 100)) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <div className="items-center gap-2 hidden md:flex">
        <SearchPopup handleSelectTrack={(track) => onSelectTrack(track)}>
          <Button>
            <SearchIcon className="size-4" />
          </Button>
        </SearchPopup>
        <Button onClick={toggleMute}>
          {volume > 0 ? (
            <LucideVolume2 className="w-4 h-4" />
          ) : (
            <LucideVolumeX className="w-4 h-4" />
          )}
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default YoutubePlayer;
