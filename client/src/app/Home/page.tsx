"use client";
import { PlaylistCard } from "@/components/playlistCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import usePlaylistStore from "@/store/playlistStore";
import { ARTIST, TRACK } from "@/types/playlist";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function Home() {
  const router = useRouter();

  // Get Zustand store actions and state
  const { Playlists, storePlaylists, updateTracks, addPlaylistTracks } =
    usePlaylistStore();

  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string>("");
  const [googleToken, setGoogleToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");

  useEffect(() => {
    if (!document.cookie) {
      console.log("No cookies found");
      return;
    }

    const googleTokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googleAccessToken="));
    const spotifyTokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("spotifyAccessToken="));

    if (googleTokenCookie) {
      setGoogleToken(googleTokenCookie.split("=")[1]);
    }
    if (spotifyTokenCookie) {
      setSpotifyAccessToken(spotifyTokenCookie.split("=")[1]);
    }
  }, []);

  const fetchPlaylists = async () => {
    const { storePlaylists, Playlists } = usePlaylistStore.getState();

    try {
      if (Playlists.length > 0) {
        // toast.message("Playlist already exists, fetching from store");
        return;
      }
      const response = await fetch(
        `${process.env.BACKEND_URL || "http://localhost:5000"}/spotify/playlists`,
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch playlists");
      }
      const data = await response.json();
      storePlaylists(data); // Store playlists in Zustand
      console.log("Playlists fetched:", Playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to fetch playlists");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaylistItemsByPID = async (PID: string) => {
    try {
      if (!spotifyAccessToken) {
        return;
      }
      const playlistTracks =
        Playlists.find((pl) => pl.S_PID === PID)?.S_TRACKS || [];

      if (playlistTracks.length > 0) {
        toast.message("Playlist already exists, fetching from store");
        router.push(`/Playlist/${PID}`);
        return;
      }

      const response = await fetch(
        `${process.env.BACKEND_URL || "http://localhost:5000"}/spotify/playlist/${PID}`,
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        },
      );

      const data = await response.json();
      addPlaylistTracks(data, PID); // Store tracks in Zustand
      setSelectedPlaylist(PID);
    } catch (error) {
      console.error("Error fetching playlist items from Spotify:", error);
      toast.error("Error fetching playlist items from Spotify");
    }
  };

  async function getYoutubeVideoId(trackName: string, artistName: string) {
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:5000"}/youtube/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackName, artistName }),
      },
    );
    const data = await response.json();

    return {
      YT_TITLE: data[0].YT_TITLE,
      YT_VIDEO_ID: data[0].YT_VIDEO_ID,
    };
  }

  async function transifyPlaylist() {
    const { Playlists, updateTracks } = usePlaylistStore.getState();

    const playlist = Playlists.find((pl) => pl.S_PID === selectedPlaylist);
    if (!playlist) {
      toast.error("Playlist not found");
      return;
    }

    const playlistTracks = playlist.S_TRACKS || [];

    // Check if all tracks already have YT_DATA
    const allTracksTransified = playlistTracks.every((track) => track.YT_DATA);

    if (allTracksTransified) {
      toast.success("Playlist Already Transified");
      router.push(`/Playlist/${selectedPlaylist}`);
      return;
    }

    // Filter tracks that need YouTube data
    const tracksNeedingUpdate = playlistTracks.filter(
      (track) => !track.YT_DATA,
    );

    try {
      const fetchedData = await Promise.all(
        tracksNeedingUpdate.map(async (track) => {
          const videoData = await getYoutubeVideoId(
            track.S_NAME,
            track.S_ARTISTS[0].name,
          );
          return { ...track, YT_DATA: videoData };
        }),
      );

      // Merge updated tracks with the existing ones
      const updatedTracks = playlistTracks.map((track) => {
        const updatedTrack = fetchedData.find((t) => t.S_NAME === track.S_NAME);
        return updatedTrack || track;
      });

      // console.log("playlistStore-updateTracks", updatedTracks);
      updateTracks(updatedTracks, selectedPlaylist);
      toast.success("Playlist Transified");
    } catch (error) {
      console.error("Error transifying playlist:", error);
      toast.error("Failed to transify playlist");
    }

    router.push(`/Playlist/${selectedPlaylist}`);
  }

  useEffect(() => {
    if (!spotifyAccessToken) return;
    fetchPlaylists();
  }, [spotifyAccessToken]);

  return (
    <div className="bg-neutral-950 w-full min-h-screen text-white p-4 font-Poppins">
      <div
        className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 ${
          selectedPlaylist ? "" : "hidden"
        }`}
      >
        <div className="bg-zinc-900 p-6 rounded-lg w-[80%] max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Playlist Tracks</h2>
            <div className="flex items-center gap-4">
              <Button
                className="bg-zinc-500 text-white p-2 rounded-md"
                onClick={transifyPlaylist}
              >
                Transify playlist
              </Button>
              <button
                onClick={() => setSelectedPlaylist("")}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {Playlists.find(
              (pl) => pl.S_PID === selectedPlaylist,
            )?.S_TRACKS.map((track: TRACK) => (
              <div
                key={track.S_TID}
                className="flex items-center space-x-4 p-2 hover:bg-zinc-800 rounded"
              >
                {track.S_ALBUM.images[0] && (
                  <img
                    src={track.S_ALBUM.images[0].url}
                    alt={track.S_NAME}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{track.S_NAME}</p>
                  <p className="text-gray-400">
                    {track.S_ARTISTS.map((artist: ARTIST) => artist.name).join(
                      ", ",
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 sm:my-4 px-2">
        <h2 className="text-3xl font-bold mb-4">Your Playlists</h2>
        {isLoading ? (
          <div className="grid lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <Skeleton
                key={index}
                className="size-[300px] sm:w-full bg-zinc-800 rounded-2xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-4">
            {Playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.S_PID}
                playlist={playlist}
                getTracks={() => getPlaylistItemsByPID(playlist.S_PID)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
