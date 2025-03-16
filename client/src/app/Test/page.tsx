"use client";
import AudioPlayer from "@/components/audioPlayer";
import usePlaylistStore from "@/store/playlistStore";
import { PLAYLIST, TRACK } from "@/types/playlist";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Test() {
  const Playlists = usePlaylistStore((state) => state.Playlists);
  // const [currentPlaylist, setCurrentPlaylist] = useState<PLAYLIST | null>(null);
  // const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  // const [playingIdx, setPlayingIdx] = useState<number>(0);

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <AudioPlayer videoId="your-video-id" />
    </div>
  );
}
