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
    const [volume, setVolume] = useState(0.75);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setIsLoaded(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    }, [VideoIds, TrackIdx]);

    const fetchAudio = async (videoId: string) => {
        if (!videoId) return;
        setIsLoaded(false);

        const audioUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${videoId}`;
        try {
            const response = await fetch(audioUrl, { method: "HEAD" });
            if (!response.ok) {
                toast.error("Failed to load & play audio");
                return;
            }

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
                audioRef.current.oncanplaythrough = () => {
                    setIsLoaded(true);
                    handlePlay(); // Auto-play after loading
                };
            }
        } catch (error) {
            toast.error("Error fetching audio");
            console.error(error);
        }
    };

    const handlePlay = () => {
        if (!isLoaded) return;
        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => setPlaying(true))
                .catch(() => toast.error("Error playing audio"));
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
            const prevIdx = (playingIdx - 1 + VideoIds.length) % VideoIds.length;
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

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
            setVolume(audioRef.current.muted ? 0 : audioRef.current.volume);
        }
    };

    //Sets initial volume, manages trackIdx changes, fetchAudioStreams
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            setPlayingIdx(TrackIdx);
            fetchAudio(VideoIds[TrackIdx]);
        }
    }, [VideoIds, TrackIdx]);

    //handles keyboard shortcuts
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
                case "N":
                    playNext();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [playing]);

    //Updates Track;s Progress bar
    useEffect(() => {
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
            <audio
                ref={audioRef}
                onEnded={playNext}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                autoPlay
            />

            {/* Track Info */}
            <div className="flex gap-2">
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
            <div className="flex flex-col items-center gap-2 w-1/3 sm:absolute sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
                {/* Playback buttons */}
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
                {/* ProgressBar */}
                <div className="relative mt-2 w-full lg:h-2 h-3 bg-gray-700 rounded-full">
                    <m.div
                        className="absolute top-0 left-0 lg:h-2 h-3 bg-[#ccff00] rounded-full"
                        animate={{
                            width: `${(progress / (audioRef.current?.duration || 100)) * 100}%`,
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={audioRef.current?.duration || 100}
                        value={progress}
                        onChange={handleProgressChange}
                        className="w-full cursor-pointer hidden md:block opacity-0 absolute"
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
