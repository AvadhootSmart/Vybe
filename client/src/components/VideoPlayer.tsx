"use client";
import React, { useRef, useState } from "react";
import YouTube from "react-youtube";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { LucidePause, LucidePlay } from "lucide-react";

const VideoPlayer = ({ videoId }) => {
    // const [Playtime, setPlaytime] = useState();
    const [playing, setPlaying] = useState<boolean>(false);

    const playerRef = useRef(null);

    const onReady = (event) => {
        playerRef.current = event.target;
        toast.success(`${videoId} loaded`);
    };

    const onStateChange = (event) => {
        if (event.data === 1) setPlaying(true);
        else setPlaying(false);
    };

    // const seek10secs = () => {
    //     if (playerRef.current) {
    //         // const newTime = Math.max
    //         playerRef.current.seekTo(10);
    //     }
    // };

    // const playVideo = () => {
    //     if (playerRef.current) playerRef.current.playVideo();
    // };

    // const pauseVideo = () => {
    //     if (playerRef.current) playerRef.current.pauseVideo();
    // };

    // const updateTime = () => {
    //     if (playerRef.current) {
    //         setPlaytime(playerRef.current.getCurrentTime());
    //     }
    // };

    const togglePlay = () => {
        if (playerRef.current) {
            if (playing) playerRef.current.pauseVideo();
            else playerRef.current.playVideo();
        }
    };

    const opts = {
        width: "100%", // Adjust width dynamically
        height: "100%", // Adjust height dynamically
        playerVars: {
            controls: 0, // Hide default controls
            modestbranding: 1, // Remove YouTube logo
            rel: 0, // Prevent showing related videos
            showinfo: 0, // Hide video info
            autoplay: 0, // No autoplay
        },
    };

    return (
        <div className="flex sm:flex-col">
            <YouTube
                videoId={videoId}
                ref={playerRef}
                opts={opts}
                onReady={onReady}
                className="hidden"
                onStateChange={onStateChange}
            />
            <div className="flex gap-2">
                {/* <Button onClick={togglePlay}>{playing ? "Pause" : "Play"}</Button> */}
                <Button onClick={togglePlay} className="cursor-pointer" variant={"default"}>
                    {playing ? (
                        <LucidePause className="w-4 h-4" />
                    ) : (
                        <LucidePlay className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
};

export default VideoPlayer;
