"use client";
import { useRef, useEffect, useState } from "react";

const RoomPlayer = ({
  roomID,
  isHost,
}: {
  roomID: string;
  isHost: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentSong, setCurrentSong] = useState<string>("GlvAH57aSpA");
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [songQueue, setSongQueue] = useState<string[]>([
    "GlvAH57aSpA",
    "iGyrWNa2Ico",
    "emK-dkaGokM",
    "5Dn-_UzLmbM",
  ]);

  // Connect WebSocket
  useEffect(() => {
    const ws = new WebSocket(
      `wss://${process.env.NEXT_PUBLIC_BACKEND_HOSTNAME}/ws/${roomID}/${isHost ? "host" : "guest"}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket ✅");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WS event:", data);

      if (!audioRef.current) {
        console.log("failed to initialize audio ref", audioRef);
        return;
      }

      switch (data.type) {
        case "play":
          if (data.songID) {
            const audioSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${data.songID}`;
            audioRef.current.src = audioSrc;
            setCurrentSong(data.songID);
          }
          audioRef.current.play();
          break;

        case "pause":
          audioRef.current.pause();
          break;

        case "next":
        case "previous":
          if (data.songID) {
            const audioSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${data.songID}`;
            audioRef.current.src = audioSrc;
            setCurrentSong(data.songID);
            audioRef.current.play();
          }
          break;

        case "addToQueue":
          // optionally update UI queue
          break;
      }
    };

    return () => ws.close();
  }, [roomID, isHost]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
    }
  }, [currentSong]);

  // send events (only host)
  const sendEvent = (type: string, songID?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, songID }));
    }
  };

  // host controls
  const handleNext = () => {
    const currentIndex = songQueue.indexOf(currentSong);
    const nextIndex = (currentIndex + 1) % songQueue.length;
    const nextSong = songQueue[nextIndex];
    setCurrentSong(nextSong);
    if (audioRef.current) {
      audioRef.current.src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${nextSong}`;
      audioRef.current.play();
    }
    sendEvent("play", nextSong);
  };

  const handlePrevious = () => {
    const currentIndex = songQueue.indexOf(currentSong);
    const prevIndex = (currentIndex - 1 + songQueue.length) % songQueue.length;
    const prevSong = songQueue[prevIndex];
    setCurrentSong(prevSong);
    if (audioRef.current) {
      audioRef.current.src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${prevSong}`;
      audioRef.current.play();
    }
    sendEvent("play", prevSong);
  };

  return (
    <div>
      <audio ref={audioRef} controls onEnded={handleNext} />
      {isHost && currentSong && (
        <div>
          <button onClick={() => sendEvent("play", currentSong)}>Play</button>
          <button onClick={() => sendEvent("pause", currentSong)}>Pause</button>
          <button onClick={handlePrevious}>Previous</button>
          <button onClick={handleNext}>Next</button>
        </div>
      )}
      <div>
        <p>Now playing: {currentSong}</p>
      </div>
      <div>
        <p className="flex flex-col">
          Queue:{" "}
          {songQueue.map((song) => (
            <span key={song}>{song}</span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default RoomPlayer;
