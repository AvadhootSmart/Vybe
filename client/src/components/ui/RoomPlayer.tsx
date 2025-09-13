"use client";
import { useRef, useEffect, useState } from "react";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { toast } from "sonner";
import RoomAudioPlayer from "./RoomAudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Users, Music, Clock } from "lucide-react";

type USER = {
  ID: string;
  Email: string;
  Name: string;
  Picture: string;
};

type LISTENER = {
  ID: string;
  Name: string;
  Picture: string;
  Email: string;
};

const RoomPlayerPage = ({
  roomID,
  isHost,
}: {
  roomID: string;
  isHost: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentSongIdx, setCurrentSongIdx] = useState<number>(0);
  const [user, setUser] = useState<USER | null>(null);
  const [listeners, setListeners] = useState<LISTENER[]>([]);
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

    const token = localStorage.getItem("googleAccessToken");

    ws.onopen = () => {
      console.log("Connected to WebSocket ✅");
      if (token) {
        ws.send(JSON.stringify({ type: "auth", token }));
      } else {
        toast.error("Unauthorized");
      }
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
          if (data.song.VideoID) {
            const audioSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${data.song.VideoID}`;
            audioRef.current.src = audioSrc;
            setCurrentSongIdx(
              songQueue.findIndex(
                (song) => song.YT_VIDEO_ID === data.song.VideoID,
              ),
            );
          }
          audioRef.current.play();
          break;

        case "pause":
          audioRef.current.pause();
          break;

        case "next":
        case "previous":
          if (data.song.VideoID) {
            const audioSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream/${data.song.VideoID}`;
            audioRef.current.src = audioSrc;
            setCurrentSongIdx(
              songQueue.findIndex(
                (song) => song.YT_VIDEO_ID === data.song.VideoID,
              ),
            );
            audioRef.current.play();
          }
          break;

        case "addToQueue":
          setSongQueue((prev) => [
            ...prev,
            {
              YT_TITLE: data.song.Title,
              YT_VIDEO_ID: data.song.VideoID,
            },
          ]);
          break;

        case "auth_success":
          setUser(data.user);
          break;

        case "all_users":
          setListeners(data.users || []);
          break;

        case "user_joined":
          if (data.user) {
            setListeners((prev) => {
              // Check if user already exists to avoid duplicates
              const exists = prev.some(listener => listener.ID === data.user.ID);
              if (!exists) {
                return [...prev, data.user];
              }
              return prev;
            });
          }
          break;

        case "user_left":
          if (data.user) {
            setListeners((prev) => prev.filter(listener => listener.ID !== data.user.ID));
          }
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
  const sendEvent = (type: string, song?: YOUTUBE_DATA) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type,
          song: {
            Title: song?.YT_TITLE,
            VideoID: song?.YT_VIDEO_ID,
          },
        }),
      );
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
    sendEvent("play", nextSong);
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
    sendEvent("play", prevSong);
  };

  const handlePlay = () => {
    sendEvent("play", songQueue[currentSongIdx]);
  };

  const handlePause = () => {
    sendEvent("pause", songQueue[currentSongIdx]);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-1 gap-8">

          {/* Room Header */}
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/20 col-span-full backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600/20 rounded-full">
                    <Music className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white capitalize">
                      {roomID}
                    </h1>
                    <p className="text-neutral-300 text-sm">Room ID: {roomID}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30">
                    <Users className="w-4 h-4 mr-2" />
                    {listeners.length} Listeners
                  </Badge>
                  {isHost && (
                    <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                      Host
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Up Next and Listeners Section - Side by Side */}
          <div className="col-span-full grid lg:grid-cols-2 gap-6">
            {/* Queue Section */}
            <Card className="bg-neutral-800/50 border-neutral-700  backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Up Next
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {songQueue.slice(currentSongIdx + 1).length > 0 ? (
                    songQueue.slice(currentSongIdx + 1).map((song, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg hover:bg-neutral-700/70 transition-colors">
                        <img src="/apple-touch-icon.png" alt="cover-img" className="size-16 rounded-md" />

                        <div className="flex-1">
                          <p className="text-white font-medium">{song.YT_TITLE}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No songs in queue</p>
                      <p className="text-sm">Add some music to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Listeners Section */}
            <Card className="bg-neutral-800/50 border-neutral-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-green-400" />
                  Listeners ({listeners.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {listeners.length > 0 ? (
                    listeners.map((listener) => {
                      const isCurrentUser = user?.ID === listener.ID;
                      const isHostUser = isCurrentUser && isHost;

                      return (
                        <div key={listener.ID} className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors">
                          <div className="relative">
                            <img
                              src={listener.Picture}
                              alt={listener.Name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-600"
                            />
                            {isHostUser && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-black font-bold">👑</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {listener.Name}
                              {isCurrentUser && " (You)"}
                            </p>
                            <p className="text-neutral-400 text-sm">
                              {isHostUser ? "Host" : "Listener"}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No listeners yet</p>
                      <p className="text-sm">Waiting for users to join...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Player Section */}
          <div className="col-span-full">
            <RoomAudioPlayer
              ref={audioRef}
              isHost={isHost}
              currentSong={songQueue[currentSongIdx]}
              onPlay={handlePlay}
              onPause={handlePause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onEnded={handleNext}
              onSearch={(track) => {
                sendEvent("addToQueue", track)
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoomPlayerPage;
