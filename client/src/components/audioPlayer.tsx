"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  LucidePause,
  LucidePlay,
  LucideSkipBack,
  LucideSkipForward,
  LucideVolume2,
  LucideVolumeX,
} from "lucide-react";
import { TRACK } from "@/types/playlist";
import { toast } from "sonner";
import Error from "next/error";

interface AudioPlayerProps {
  VideoIds: string[];
  playlistTracks: TRACK[];
  TrackIdx: number;
}

const AudioPlayer = ({
  VideoIds,
  playlistTracks,
  TrackIdx,
}: AudioPlayerProps) => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [playingIdx, setPlayingIdx] = useState<number>(TrackIdx);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75); // Default volume 50%

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsLoaded(false);
    setError("");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [VideoIds, TrackIdx]);

  const fetchAudio = async (videoId: string) => {
    if (!videoId) return;

    const audioUrl = `http://localhost:8001/stream/${videoId}`;
    try {
      setError("");

      const response = await fetch(audioUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.statusText}`);
      }

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setIsLoaded(true);
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoaded(false);
    }
  };

  const handlePlay = () => {
    if (!isLoaded && VideoIds[playingIdx]) {
      fetchAudio(VideoIds[playingIdx]).then(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch(() => toast.error("Error playing audio"));
          setPlaying(true);
        }
      });
    } else if (audioRef.current) {
      audioRef.current.play().catch(() => toast.error("Error playing audio"));
      setPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const playNext = () => {
    if (VideoIds.length > 0) {
      const nextIdx = (playingIdx + 1) % VideoIds.length;
      setPlayingIdx(nextIdx);
      fetchAudio(VideoIds[nextIdx]);
    }
  };

  const playPrev = () => {
    if (VideoIds.length > 0) {
      const prevIdx = (playingIdx - 1) % VideoIds.length;
      setPlayingIdx(prevIdx);
      fetchAudio(VideoIds[prevIdx]);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setPlayingIdx(TrackIdx);
      fetchAudio(VideoIds[TrackIdx]);
    }
  }, [VideoIds, TrackIdx]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!audioRef.current) return;

      switch (event.key) {
        case " ":
          // playing ? handlePause() : handlePlay();
          if (playing) {
            handlePause();
            setPlaying(false);
          } else {
            handlePlay();
            setPlaying(true);
          }
          break;
        case "ArrowRight":
          audioRef.current.currentTime += 5;
          break;
        case "ArrowLeft":
          audioRef.current.currentTime -= 5;
          break;
        case "N":
          playNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        setPlaying(false);
      } else {
        setPlaying(true);
      }
    }

    const updateProgress = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", updateProgress);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, []);

  return (
    <div className="p-2 bg-white/10 backdrop-blur-lg sm:backdrop-blur-3xl w-full flex font-Poppins rounded-xl justify-between items-center relative">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={playNext} autoPlay />

      {/* Track Info */}
      <div className="flex gap-2">
        {playlistTracks.length > 0 ? (
          <img
            loading="lazy"
            src={playlistTracks[playingIdx]?.S_ALBUM?.images?.[0]?.url}
            alt="Album Cover"
            className="size-20 rounded-lg"
          />
        ) : (
          <div className="size-20 rounded-lg bg-zinc-700"></div>
        )}

        <div className="flex flex-col">
          <h1 className="text-sm font-semibold">
            {playlistTracks[playingIdx]?.S_NAME || "Unknown Track"}
          </h1>
          <h2 className="text-neutral-400 text-xs">
            {playlistTracks[playingIdx]?.S_ARTISTS?.[0]?.name ||
              "Unknown Artist"}
          </h2>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col items-center gap-2 w-1/3 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="flex gap-1 md:gap-2 pr-2 md:pr-0">
          <Button onClick={playPrev}>
            <LucideSkipBack />
          </Button>
          <Button
            onClick={playing ? handlePause : handlePlay}
            disabled={!isLoaded}
          >
            {playing ? (
              <LucidePause className="w-4 h-4" />
            ) : (
              <LucidePlay className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={playNext}>
            <LucideSkipForward />
          </Button>
        </div>
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={audioRef.current?.duration || 100}
          value={progress}
          onChange={handleProgressChange}
          className="w-full cursor-pointer hidden md:block"
        />
      </div>

      {/* Volume Control */}
      <div className="items-center gap-2 hidden md:flex">
        <Button
          onClick={() => {
            setVolume(volume > 0 ? 0 : 0.5);
            handleVolumeChange({ target: { value: volume > 0 ? 0 : 0.5 } });
          }}
        >
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

export default AudioPlayer;
