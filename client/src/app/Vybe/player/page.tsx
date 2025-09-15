"use client";
import YoutubePlayer from "@/components/youtubePlayer";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { SearchPopup } from "@/components/searchPopup";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

const ExplorePage = () => {
  const [googleToken, setGoogleToken] = useState("");
  const [queue, setQueue] = useState<YOUTUBE_DATA[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  async function getUser() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${googleToken}`,
      },
    });
    const data = await response.json();
    return data;
  }

  useEffect(() => {
    const token = localStorage.getItem("googleAccessToken");
    if (token) setGoogleToken(token);
  }, []);

  useEffect(() => {
    if (googleToken) {
      getUser();
    }
  }, [googleToken]);

  return (
    <div className="bg-neutral-950">
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col gap-10 items-center font-Poppins bg-neutral-950 text-white py-10 px-4 overflow-hidden relative">
        <div className="w-full flex flex-col gap-20">
          <Image
            src="/apple-touch-icon.png"
            alt=""
            className="w-[200px] object-cover self-center rounded-xl"
            width={1200}
            height={675}
          />
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Queue</h2>
            </div>
            <div className="space-y-3 min-h-[40vh]">
              {queue.length > 0 ? (
                queue.map((song, idx) => (
                  <button
                    key={song.YT_VIDEO_ID + idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors",
                      idx === currentIdx ? "bg-neutral-700/70" : "hover:bg-neutral-800/70"
                    )}
                  >
                    <img
                      src="/apple-touch-icon.png"
                      alt="cover-img"
                      className="size-12 rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {song.YT_TITLE}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col gap-3 items-center justify-center h-[40vh] text-neutral-400">
                  <div className="text-center">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No songs in queue</p>
                  </div>
                  <SearchPopup
                    handleSelectTrack={(track) =>
                      setQueue((prev) =>
                        prev.find((t) => t.YT_VIDEO_ID === track.YT_VIDEO_ID)
                          ? prev
                          : [...prev, track]
                      )
                    }
                  >
                    <Button variant="outline" className="dark">
                      Add Song to queue
                    </Button>
                  </SearchPopup>
                </div>
              )}
            </div>
          </div>
        </div>

        {queue.length > 0 && (
          <div className="fixed z-50 bottom-8 w-[90%] lg:w-[80%] ">
            <YoutubePlayer
              track={queue[currentIdx]}
              onPrev={queue.length > 1 ? () => setCurrentIdx((i) => (i - 1 + queue.length) % queue.length) : undefined}
              onNext={() => setCurrentIdx((i) => (i + 1) % queue.length)}
              onSelectTrack={(item) => {
                setQueue((prev) =>
                  prev.find((t) => t.YT_VIDEO_ID === item.YT_VIDEO_ID)
                    ? prev
                    : [...prev, item]
                );
                if (queue.length === 0) setCurrentIdx(0);
              }}
            />
          </div>
        )}
      </div>
    </div >
  );
};

export default ExplorePage;
