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
  LucideShuffle,
} from "lucide-react";
import { TRACK } from "@/types/playlist";
import { toast } from "sonner";
import { AnimatePresence, motion as m } from "motion/react";

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
  const [playing, setPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(TrackIdx);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.25);
  const [isShuffle, setShuffle] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAudio = (videoId: string) => {
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

  const getNextIndex = (): number => {
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * VideoIds.length);
      return randomIdx !== playingIdx ? randomIdx : getNextIndex();
    }
    return (playingIdx + 1) % VideoIds.length;
  };

  const playNext = () => {
    const nextIdx = getNextIndex();
    setPlayingIdx(nextIdx);
    fetchAudio(VideoIds[nextIdx]);
  };

  const playPrev = () => {
    const prevIdx = (playingIdx - 1 + VideoIds.length) % VideoIds.length;
    setPlayingIdx(prevIdx);
    fetchAudio(VideoIds[prevIdx]);
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

  const toggleShuffle = () => setShuffle((prev) => !prev);

  useEffect(() => {
    setPlayingIdx(TrackIdx);
    fetchAudio(VideoIds[TrackIdx]);
  }, [VideoIds, TrackIdx]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!audioRef.current) return;
      switch (event.key) {
        case " ":
          event.preventDefault();
          if (playing) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case "ArrowRight":
          audioRef.current.currentTime += 5;
          break;
        case "ArrowLeft":
          audioRef.current.currentTime -= 5;
          break;
        case "n":
        case "N":
          playNext();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [playing]);

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

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: playlistTracks[playingIdx]?.S_NAME || "Unknown Track",
        artist:
          playlistTracks[playingIdx]?.S_ARTISTS?.map((a) => a.name).join(
            ", ",
          ) || "Unknown Artist",
        album: playlistTracks[playingIdx]?.S_ALBUM?.name || "",
        artwork: [
          {
            src:
              playlistTracks[playingIdx]?.S_ALBUM?.images?.[0]?.url ||
              "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });

      // Hook gestures / hardware events
      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("previoustrack", playPrev);
      navigator.mediaSession.setActionHandler("nexttrack", playNext);
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (audioRef.current) audioRef.current.currentTime -= 10;
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (audioRef.current) audioRef.current.currentTime += 10;
      });
    }
  }, [playingIdx, playlistTracks]);

  return (
    <div className="p-2 bg-white/10 backdrop-blur-lg w-full flex sm:flex-row flex-col font-Poppins rounded-xl sm:justify-between sm:items-center items-center relative">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        autoPlay
        onEnded={playNext}
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
        <AnimatePresence mode="wait">
          {playlistTracks.length > 0 ? (
            <m.img
              key={playingIdx}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
              loading="lazy"
              src={playlistTracks[playingIdx]?.S_ALBUM?.images?.[0]?.url}
              alt="Album Cover"
              className="size-20 rounded-lg"
            />
          ) : (
            <div className="size-20 rounded-lg bg-zinc-700"></div>
          )}
        </AnimatePresence>
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <m.h1
              key={`title-${playingIdx}`}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.35 }}
              className="text-sm font-semibold"
            >
              {playlistTracks[playingIdx]?.S_NAME || "Unknown Track"}
            </m.h1>
            <m.h2
              key={`artist-${playingIdx}`}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="text-neutral-400 text-xs"
            >
              {playlistTracks[playingIdx]?.S_ARTISTS?.[0]?.name ||
                "Unknown Artist"}
            </m.h2>
          </AnimatePresence>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col-reverse sm:flex-col items-center gap-2 w-full sm:w-1/3 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="flex gap-1 md:gap-2 justify-center sm:justify-start">
          <Button onClick={playPrev}>
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
          <Button onClick={playNext}>
            <LucideSkipForward />
          </Button>
          <Button
            variant={isShuffle ? "default" : "outline"}
            onClick={toggleShuffle}
            title="Toggle Shuffle"
            className="dark"
          >
            <LucideShuffle className="w-4 h-4" />
          </Button>
        </div>

        {/* ProgressBar */}
        <div className="relative mt-2 w-full lg:h-2 h-3 bg-gray-700 rounded-full">
          <m.div
            className="absolute top-0 left-0 lg:h-2 h-3 bg-[#ccff00] rounded-full"
            animate={{
              width: `${
                (progress / (audioRef.current?.duration || 100)) * 100
              }%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <div className="items-center gap-2 hidden md:flex">
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

export default AudioPlayer;
