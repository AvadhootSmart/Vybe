"use client";
import React, { useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import usePlaylistStore from "@/store/playlistStore";
import { PLAYLIST, TRACK } from "@/types/playlist";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LucideChevronLeft } from "lucide-react";

const PlaylistPage = () => {
  const { id } = useParams();
  const { Playlists } = usePlaylistStore.getState();
  const [currentPlaylist, setCurrentPlaylist] = useState<PLAYLIST>();
  const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);

  useEffect(() => {
    const currPlaylist = Playlists.filter((pl) => {
      return pl.S_PID === id;
    });
    console.log(currPlaylist);
    setCurrentPlaylist(currPlaylist[0]);
    setPlaylistTracks(currPlaylist[0].S_TRACKS || []);
  }, []);

  return (
    <div className="w-full h-screen bg-neutral-950 text-white py-8 px-4 overflow-hidden">
      <div className="flex gap-4 mb-4">
        <Link href={`/Home`}>
          <LucideChevronLeft className="size-10" />
        </Link>
        <h2 className="text-3xl font-bold mb-4 w-full truncate">
          {currentPlaylist?.S_NAME}
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        {playlistTracks.map((track: TRACK) => (
          <div key={track.S_TID}>
            {/* <h1>Play Tracks</h1> */}
            <div className="w-full flex gap-2 items-center" key={track.S_TID}>
              <VideoPlayer
                videoId={track.YT_DATA.YT_VIDEO_ID}
                title={track.S_NAME}
              />
              <img
                src={track.S_ALBUM.images[0].url}
                alt={track.S_NAME}
                className="size-20 object-cover rounded-lg"
              />
              <div>
                <h1 className="lg:text-xl sm:text-lg">{track.S_NAME}</h1>
                <h2 className="lg:text-lg sm:text-md text-zinc-400">
                  {track.S_ARTISTS[0].name}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPage;
