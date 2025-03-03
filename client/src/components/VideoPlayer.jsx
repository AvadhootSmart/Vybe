import React, { useRef } from "react";
import YouTube from "react-youtube";

const VideoPlayer = ({ videoId }) => {
  const playerRef = useRef(null);

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  const seek10secs = () => {
    if (playerRef.current) playerRef.current.seek(10);
  };

  const playVideo = () => {
    if (playerRef.current) playerRef.current.playVideo();
  };

  const pauseVideo = () => {
    if (playerRef.current) playerRef.current.pauseVideo();
  };
  return (
    <div>
      <YouTube
        videoId={videoId}
        ref={playerRef}
        opts={{ height: "390", width: "640" }}
        onReady={onReady}
      />
      <button onClick={playVideo}>Play</button>
      <button onClick={pauseVideo}>Pause</button>
      <button onClick={seek10secs}>Seek 10 seconds</button>
    </div>
  );
};

export default VideoPlayer;
