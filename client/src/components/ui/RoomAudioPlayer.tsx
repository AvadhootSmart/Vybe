"use client";
import { forwardRef, useState, useEffect } from "react";
import { Button } from "./button";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { SearchPopup } from "../searchPopup";
import {
  LucidePause,
  LucidePlay,
  LucideSkipBack,
  LucideSkipForward,
  LucideVolume2,
  LucideVolumeX,
  SearchIcon,
} from "lucide-react";
import { motion as m } from "motion/react";
// import { VolumeSlider } from "../volumeSlider";

interface RoomAudioPlayerProps {
  isHost: boolean;
  currentSong: YOUTUBE_DATA | null;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onEnded: () => void;
  onSearch: (track: YOUTUBE_DATA) => void;
}

const RoomAudioPlayer = forwardRef<HTMLAudioElement, RoomAudioPlayerProps>(
  (
    {
      isHost,
      currentSong,
      onPlay,
      onPause,
      onNext,
      onPrevious,
      onEnded,
      onSearch,
    },
    ref,
  ) => {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.25);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.volume = newVolume;
      }
      setVolume(newVolume);
    };
    //
    // const handleVolumeChange = (value: number[]) => {
    //   const newVolume = value[0];
    //   if (ref && typeof ref !== "function" && ref.current) {
    //     ref.current.volume = newVolume;
    //   }
    //   setVolume(newVolume);
    // };

    const toggleMute = () => {
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.muted = !ref.current.muted;
        setVolume(ref.current.muted ? 0 : ref.current.volume);
      }
    };

    useEffect(() => {
      const updateProgress = () => {
        if (ref && typeof ref !== "function" && ref.current) {
          setProgress(ref.current.currentTime);
        }
      };

      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.addEventListener("timeupdate", updateProgress);
        ref.current.addEventListener("play", () => setPlaying(true));
        ref.current.addEventListener("pause", () => setPlaying(false));

        return () => {
          ref.current?.removeEventListener("timeupdate", updateProgress);
          ref.current?.removeEventListener("play", () => setPlaying(true));
          ref.current?.removeEventListener("pause", () => setPlaying(false));
        };
      }
    }, [ref]);

    return (
      <div className="p-2 bg-white/10 backdrop-blur-lg w-full flex sm:flex-row flex-col font-Poppins rounded-xl sm:justify-between sm:items-center items-center relative">
        {/* Hidden Audio Element */}
        <audio
          ref={ref}
          onEnded={onEnded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Track Info */}
        <div className="hidden gap-2 sm:flex">
          <img
            src="/apple-touch-icon.png"
            alt="album-img"
            className="size-20 rounded-lg"
          />
          <div className="flex flex-col">
            <m.h1
              key={currentSong?.YT_VIDEO_ID}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.35 }}
              className="text-sm font-semibold text-white"
            >
              {currentSong?.YT_TITLE || "Unknown Video"}
            </m.h1>
            <span className="text-neutral-400 text-xs">YouTube</span>
          </div>
        </div>

        {/* Playback Controls */}
        {isHost && (
          <div className="flex flex-col-reverse sm:flex-col items-center gap-2 w-full sm:w-1/3 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
            <div className="flex gap-1 md:gap-2 justify-center sm:justify-start">
              <Button onClick={onPrevious}>
                <LucideSkipBack />
              </Button>
              <Button variant="default" onClick={playing ? onPause : onPlay}>
                {playing ? (
                  <LucidePause className="w-4 h-4" />
                ) : (
                  <LucidePlay className="w-4 h-4" />
                )}
              </Button>
              <Button onClick={onNext}>
                <LucideSkipForward />
              </Button>
              <SearchPopup handleSelectTrack={(track) => onSearch(track)}>
                <Button className="sm:hidden">
                  <SearchIcon className="size-4" />
                </Button>
              </SearchPopup>
            </div>

            {/* ProgressBar */}
            <div className="relative mt-2 w-full lg:h-2 h-3 bg-gray-700 rounded-full">
              <m.div
                className="absolute top-0 left-0 lg:h-2 h-3 bg-vybe rounded-full"
                animate={{
                  width: `${(progress / ((ref && typeof ref !== "function" && ref.current?.duration) || 100)) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
              />
            </div>
          </div>
        )}

        {/* Volume Control */}
        {isHost && (
          <div className="items-center gap-2 hidden md:flex">
            <SearchPopup handleSelectTrack={(track) => onSearch(track)}>
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
        )}
        {/* <VolumeSlider */}
        {/*   className="w-full sm:w-1/5" */}
        {/*   value={[volume]} */}
        {/*   onValueChange={handleVolumeChange} */}
        {/*   onMute={toggleMute} */}
        {/* /> */}
      </div>
    );
  },
);

RoomAudioPlayer.displayName = "RoomAudioPlayer";

export default RoomAudioPlayer;
