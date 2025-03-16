"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { LucidePause, LucidePlay, LucideSkipForward } from "lucide-react";
import { TRACK } from "@/types/playlist";

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

      // Check if audio exists before setting src
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
          audioRef.current.play().catch(() => setError("Error playing audio"));
          setPlaying(true);
        }
      });
    } else if (audioRef.current) {
      audioRef.current.play().catch(() => setError("Error playing audio"));
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

  useEffect(() => {
    if (audioRef.current && isLoaded) {
      setPlayingIdx(TrackIdx);
      fetchAudio(VideoIds[TrackIdx]);
    }
  }, [VideoIds, TrackIdx]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!audioRef.current) return;

      switch (event.key) {
        case " ":
          playing ? handlePause() : handlePlay();
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

  return (
    <div className="p-2 bg-white/10 backdrop-blur-lg sm:backdrop-blur-3xl w-full flex font-Poppins rounded-xl justify-between items-center">
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
      <div className="flex gap-2">
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
    </div>
  );
};

export default AudioPlayer;
