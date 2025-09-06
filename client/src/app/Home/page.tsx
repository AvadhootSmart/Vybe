"use client";
import { PlaylistCard } from "@/components/playlistCard";
import { PlaylistPopup } from "@/components/playlistPopup";
import { Button } from "@/components/ui/button";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import usePlaylistStore from "@/store/playlistStore";
import { LucideSettings2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
// import { ARTIST, TRACK } from "@/types/playlist";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion as m } from "motion/react";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { TRACK } from "@/types/playlist";

function Home() {
  const router = useRouter();

  // Get Zustand store actions and state
  const { Playlists, addPlaylistTracks } = usePlaylistStore();

  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string>("");
  const [googleToken, setGoogleToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");

  useEffect(() => {
    // Read Spotify token from cookie (unchanged behavior)
    const spotifyTokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("spotifyAccessToken="));
    if (spotifyTokenCookie) {
      setSpotifyAccessToken(spotifyTokenCookie.split("=")[1]);
    }

    // Read Google token only from localStorage
    const storedGoogleToken = localStorage.getItem("googleAccessToken");
    if (storedGoogleToken) {
      setGoogleToken(storedGoogleToken);
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/playlists`,
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
        // toast.message("Playlist already exists, fetching from store");
        router.push(`/Playlist/${PID}`);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/playlist/${PID}`,
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

  async function getPlaylistYTData(
    tracks: string[],
  ): Promise<{ data: YOUTUBE_DATA[] } | undefined> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/playlist/tracks/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tracks }),
      },
    );
    const data = await response.json();

    if (data.length === 0) {
      toast.error("No YouTube video found for this track");
      return;
    }
    return data;
  }

  async function transifyPlaylist() {
    const { Playlists, updateTracks } = usePlaylistStore.getState();

    const playlist = Playlists.find((pl) => pl.S_PID === selectedPlaylist);
    if (!playlist) {
      toast.error("Playlist not found");
      return;
    }

    const playlistTracks = playlist.S_TRACKS || [];

    // Skip if all tracks already have YT_DATA
    if (playlistTracks.every((track) => track.YT_DATA)) {
      toast.success("Playlist Already Transified");
      router.push(`/Playlist/${selectedPlaylist}`);
      return;
    }

    // Tracks needing update
    const tracksNeedingUpdate = playlistTracks.filter(
      (track) => !track.YT_DATA,
    );

    try {
      // Build request payload
      const payload = {
        tracks: tracksNeedingUpdate.map(
          (track) => `${track.S_NAME}, ${track.S_ARTISTS[0].name}`,
        ),
      };

      // Send batch request
      const response = await getPlaylistYTData(payload.tracks);
      // response.data = flat array, same order as payload.tracks
      const ytDataArray = response?.data;

      // Map results back to tracksNeedingUpdate
      const updatedTracks = playlistTracks.map((track) => {
        const idx = tracksNeedingUpdate.findIndex(
          (t) => t.S_NAME === track.S_NAME,
        );
        if (idx !== -1 && ytDataArray) {
          return { ...track, YT_DATA: ytDataArray[idx] }; 
        }
        return track; // already had YT_DATA
      });

      updateTracks(updatedTracks, selectedPlaylist);
      toast.success("Playlist Transified");
    } catch (err) {
      console.error("Error transifying playlist:", err);
      toast.error("Failed to transify playlist");
    }

    router.push(`/Playlist/${selectedPlaylist}`);
  }

  function ClearLocalStorage() {
    localStorage.clear();
    toast.success("Local Storage Cleared");
    window.location.reload();
  }

  useEffect(() => {
    if (!spotifyAccessToken) return;
    fetchPlaylists();
  }, [spotifyAccessToken]);

  const PlaylistsVariant = {
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        staggerChildren: 0.02,
      },
    },
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
    exit: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  const PlaylistCardVariant = {
    visible: {
      opacity: 1,
      filter: "blur(0px)",
    },
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
  };

  return (
    <div className="bg-neutral-950 w-full min-h-screen text-white p-4 lg:px-[10%] font-Poppins">
      {selectedPlaylist && (
        <PlaylistPopup
          isOpen={!!selectedPlaylist}
          selectedPlaylist={selectedPlaylist}
          setSelectedPlaylist={setSelectedPlaylist}
          transifyPlaylist={transifyPlaylist}
        />
      )}
      <div className="mt-8 sm:my-4 px-2">
        <div className="w-full flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your Playlists</h2>
          <Button onClick={ClearLocalStorage}>
            <LucideSettings2 />
          </Button>
        </div>
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
          <AnimatePresence>
            <m.div
              className="grid md:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={PlaylistsVariant}
            >
              {Playlists.map((playlist) => (
                <m.div key={playlist.S_PID} variants={PlaylistCardVariant}>
                  <PlaylistCard
                    playlist={playlist}
                    getTracks={() => getPlaylistItemsByPID(playlist.S_PID)}
                  />
                </m.div>
              ))}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Home;
