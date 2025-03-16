"use client";
import React, { useEffect, useState } from "react";
import usePlaylistStore from "@/store/playlistStore";
import { PLAYLIST, TRACK } from "@/types/playlist";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LucideChevronLeft } from "lucide-react";
import { Player } from "@/components/Player";
import { toast } from "sonner";
import AudioPlayer from "@/components/audioPlayer";

const PlaylistPage = () => {
  const { id } = useParams();
  const Playlists = usePlaylistStore((state) => state.Playlists);
  const [currentPlaylist, setCurrentPlaylist] = useState<PLAYLIST | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [playingIdx, setPlayingIdx] = useState<number>(0);

  const fetchAudioTracks = async (trackIds: string[]) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/transify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoIds: trackIds }),
      },
    );

    if (response.ok) {
      toast.success("Playlist Transified with audio files");
    }
  };

  useEffect(() => {
    const currPlaylist = Playlists.filter((pl) => {
      return pl.S_PID === id;
    });

    if (currPlaylist.length > 0) {
      setCurrentPlaylist(currPlaylist[0]);
      setPlaylistTracks(currPlaylist[0].S_TRACKS || []);
      if (
        currPlaylist[0].S_TRACKS.length > 0 &&
        currPlaylist[0].S_TRACKS[0].YT_DATA
      ) {
        setTrackIds(
          currPlaylist[0].S_TRACKS.map(
            (track: TRACK) => track.YT_DATA.YT_VIDEO_ID,
          ),
        );

        console.log(
          currPlaylist[0].S_TRACKS.map(
            (track: TRACK) => track.YT_DATA.YT_VIDEO_ID,
          ),
        );
      } else {
        setTrackIds([]);
        toast.error("Something went wrong while transifying playlist");
      }
    }

    console.log(currPlaylist[0]);
  }, [id, Playlists]);

  useEffect(() => {
    if (trackIds.length > 0) {
      fetchAudioTracks(trackIds);
    }
  }, [trackIds]);

  return (
    <div className="w-full min-h-screen flex flex-col gap-10 items-center font-Poppins bg-neutral-950 text-white py-8 px-2 lg:px-[20%] overflow-hidden relative">
      {/* <div className="fixed bottom-8 w-[90%] lg:w-[60%] "> */}
      {/*   <Player */}
      {/*     TrackIdx={playingIdx} */}
      {/*     playlistTracks={playlistTracks} */}
      {/*     VideoIds={trackIds} */}
      {/*   /> */}
      {/* </div> */}
      <div className="fixed bottom-8 w-[90%] lg:w-[60%] ">
        <AudioPlayer
          TrackIdx={playingIdx}
          playlistTracks={playlistTracks}
          VideoIds={trackIds}
        />
      </div>
      <div className="fixed top-4 left-4 lg:top-10 lg:left-10">
        <Link href={`/Home`}>
          <LucideChevronLeft className="size-8 sm:size-10" />
        </Link>
      </div>
      <div className="w-full h-[40%] mt-8 flex flex-col gap-4 justify-center items-center">
        <img
          src={currentPlaylist?.S_IMAGES[0].url}
          alt="album-cover"
          className="w-[200px] object-cover rounded-xl"
        />
        <h2 className="text-3xl font-bold  truncate">
          {currentPlaylist?.S_NAME}
        </h2>
      </div>

      {/* trackList */}
      <div className="flex flex-col gap-4 w-full mb-20">
        {playlistTracks.map((track: TRACK) => (
          <div
            key={track.S_TID}
            role="button"
            onClick={() => setPlayingIdx(playlistTracks.indexOf(track))}
            className="cursor-pointer"
          >
            <div
              className="w-full flex gap-2 items-center rounded-lg hover:bg-zinc-800 transition-all p-2"
              key={track.S_TID}
            >
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
