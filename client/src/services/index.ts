import usePlaylistStore from "@/store/playlistStore";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import router from "next/router";
import { toast } from "sonner";

export async function transifyPlaylist(selectedPlaylist: string) {
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
  const tracksNeedingUpdate = playlistTracks.filter((track) => !track.YT_DATA);

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

export async function getPlaylistYTData(
  tracks: string[],
): Promise<{ data: YOUTUBE_DATA[] } | undefined> {
  const response = await fetch(
    // `${process.env.NEXT_PUBLIC_BACKEND_URL}/playlist/tracks/search`,
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/youtube/search`,
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
