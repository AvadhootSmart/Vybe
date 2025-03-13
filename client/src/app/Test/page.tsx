'use client'
// pages/index.tsx
import { useState, useRef, useEffect } from "react";
import Head from "next/head";

export default function Home() {
  const [videoId, setVideoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const fetchAudio = async () => {
    if (!videoId.trim()) {
      setError("Please enter a valid YouTube Video ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setTitle("");

      // Reset audio player
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      }

      const response = await fetch("http://localhost:5000/v1/youtube-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: videoId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch audio");
      }

      // Get title from header if available
      const contentDisposition =
        response.headers.get("Content-Disposition") || "";
      const titleMatch = contentDisposition.match(/filename="(.+?)\.mp3"/);
      if (titleMatch && titleMatch[1]) {
        setTitle(titleMatch[1]);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        audioRef.current.load();

        // Play automatically when loaded
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((e) => console.error("Auto-play prevented:", e));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current?.src) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const progressRect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - progressRect.left) / progressRect.width;
    const newTime = clickPosition * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Clean up URL object on unmount or when src changes
  useEffect(() => {
    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Head>
        <title>YouTube Audio Player</title>
        <meta name="description" content="Efficient YouTube audio player" />
      </Head>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          YouTube Audio Player
        </h1>

        <div className="mb-4 flex">
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID"
            className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={fetchAudio}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r focus:outline-none disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Play"}
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {title && (
          <div className="mb-4 p-2 bg-gray-50 rounded text-sm truncate">
            <strong>Now Playing:</strong> {title}
          </div>
        )}

        <div className="bg-gray-200 rounded-lg p-4 shadow-inner">
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="h-2 bg-gray-300 rounded-full mb-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-red-600 rounded-full"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            ></div>
          </div>

          <div className="flex justify-between text-xs text-gray-600 mb-3">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full focus:outline-none"
                disabled={!audioRef.current?.src}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gray-600"
              >
                <path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M14,3.23v2.06c2.89,0.86,5,3.54,5,6.71c0,3.17-2.11,5.85-5,6.71v2.06c4.01-0.91,7-4.49,7-8.77C21,7.72,18.01,4.14,14,3.23z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={() =>
            setCurrentTime(audioRef.current?.currentTime || 0)
          }
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
          hidden
        />
      </div>
    </div>
  );
}
