"use client";
import React, { useRef, useState } from "react";
import YouTube from "react-youtube";
import { Button } from "./ui/button";

const VideoPlayer = ({ videoId }) => {
  const [Playtime, setPlaytime] = useState();

  const playerRef = useRef(null);

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  const seek10secs = () => {
    if (playerRef.current) {
      // const newTime = Math.max
      playerRef.current.seekTo(10);
    }
  };

  const playVideo = () => {
    if (playerRef.current) playerRef.current.playVideo();
  };

  const pauseVideo = () => {
    if (playerRef.current) playerRef.current.pauseVideo();
  };

  const updateTime = () => {
    if (playerRef.current) {
      setPlaytime(playerRef.current.getCurrentTime());
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
        // onStateChange={}
      />
      <div className="flex gap-2">
        <Button onClick={playVideo}>Play</Button>
        <Button onClick={pauseVideo}>Pause</Button>
        <p>{Playtime}</p>
        {/* <Button onClick={seek10secs}>Seek 10 seconds</Button> */}
      </div>
    </div>
  );
};

export default VideoPlayer;
