"use client";
import { useRef, useEffect, useState } from "react";
import { Button } from "./button";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { SearchPopup } from "../searchPopup";

const RoomPlayer = ({
  roomID,
  isHost,
}: {
  roomID: string;
  isHost: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentSongIdx, setCurrentSongIdx] = useState<number>(0);
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [songQueue, setSongQueue] = useState<YOUTUBE_DATA[]>([
    {
      YT_TITLE: "Waiting",
      YT_VIDEO_ID: "GlvAH57aSpA",
    },
    {
      YT_TITLE: "Sleepless Nights",
      YT_VIDEO_ID: "iGyrWNa2Ico",
    },
    {
      YT_TITLE: "Your boyfriend's Car",
      YT_VIDEO_ID: "emK-dkaGokM",
    },
    {
      YT_TITLE: "Faith",
      YT_VIDEO_ID: "5Dn-_UzLmbM",
    },
    {
      YT_TITLE: "Better Now - Caslow Remix",
      YT_VIDEO_ID: "nvKklOc3Rtk ",
    },
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
            setCurrentSongIdx(
              songQueue.findIndex((song) => song.YT_VIDEO_ID === data.songID),
            );
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
            setCurrentSongIdx(
              songQueue.findIndex((song) => song.YT_VIDEO_ID === data.songID),
            );
            audioRef.current.play();
          }
          break;

        case "addToQueue":
          // optionally update UI queue
          break;
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomID, isHost]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
    }
  }, [currentSongIdx]);

  // send events (only host)
  const sendEvent = (type: string, songID?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, songID }));
    }
  };

  // host controls
  const handleNext = () => {
    const nextIndex = (currentSongIdx + 1) % songQueue.length;
    const nextSong = songQueue[nextIndex];
    setCurrentSongIdx(nextIndex);
    if (audioRef.current) {
      audioRef.current.src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${nextSong.YT_VIDEO_ID}`;
      audioRef.current.play();
    }
    sendEvent("play", nextSong.YT_VIDEO_ID);
  };

  const handlePrevious = () => {
    const prevIndex =
      (currentSongIdx - 1 + songQueue.length) % songQueue.length;
    const prevSong = songQueue[prevIndex];
    setCurrentSongIdx(prevIndex);
    if (audioRef.current) {
      audioRef.current.src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${prevSong.YT_VIDEO_ID}`;
      audioRef.current.play();
    }
    sendEvent("play", prevSong.YT_VIDEO_ID);
  };

  return (
    <div>
      <audio ref={audioRef} controls onEnded={handleNext} />
      {isHost && (
        <div className="space-x-2">
          <Button
            onClick={() =>
              sendEvent("play", songQueue[currentSongIdx].YT_VIDEO_ID)
            }
          >
            Play
          </Button>
          <Button
            onClick={() =>
              sendEvent("pause", songQueue[currentSongIdx].YT_VIDEO_ID)
            }
          >
            Pause
          </Button>
          <Button onClick={handlePrevious}>Previous</Button>
          <Button onClick={handleNext}>Next</Button>
          <SearchPopup
            handleSelectTrack={(track) => {
              setSongQueue((prev) => [...prev, track]);
              sendEvent("addToQueue", track.YT_VIDEO_ID);
            }}
          >
            <Button>Search</Button>
          </SearchPopup>
        </div>
      )}
      <div>
        <p className="flex flex-col">
          Up Next:{" "}
          {songQueue.slice(currentSongIdx + 1).map((song, idx) => (
            <span key={idx}>{song.YT_TITLE}</span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default RoomPlayer;
