import usePlaylistStore from "@/store/playlistStore";
import { YOUTUBE_DATA } from "@/types/youtubeData";
// import router from "next/dist/client/router";
import { toast } from "sonner";

export async function getYoutubeVideoId(
  trackName: string,
  artistName: string,
): Promise<{ YT_TITLE: string; YT_VIDEO_ID: string }> {
  const googleToken = localStorage.getItem("googleAccessToken");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/youtube/search`,
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

    if (data.length === 0) {
      toast.error("No YouTube video found for this track");
      return {
        YT_TITLE: "",
        YT_VIDEO_ID: "",
      };
    }

    if (response.status === 403) {
      toast.error("Youtube API Limit Exceeded, Try again tomorrow");
    }

    return {
      YT_TITLE: data[0].YT_TITLE,
      YT_VIDEO_ID: data[0].YT_VIDEO_ID,
    };

    //eslint-disable-next-line
  } catch (error: any) {
    console.error("Error fetching playlist items from Spotify:", error);
    return {
      YT_TITLE: "",
      YT_VIDEO_ID: "",
    };
  }
}

export async function getPlaylistYTData(
  query: string,
): Promise<{ data: YOUTUBE_DATA[] } | undefined> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const data = await response.json();

  if (data.length === 0) {
    toast.error("No YouTube video found for this track");
    return;
  }
  return data;
}

export async function transifyPlaylist(
  selectedPlaylist: string,
  type: "yt-api" | "yt-search",
) {
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
    return true;
    // router.push(`/Playlist/${selectedPlaylist}`);
  }

  // Tracks needing update
  const tracksNeedingUpdate = playlistTracks.filter((track) => !track.YT_DATA);

  try {
    let updatedTracks: typeof playlistTracks = [];

    if (type === "yt-api") {
      // One-by-one fetch using YouTube API
      const fetchedData = await Promise.all(
        tracksNeedingUpdate.map(async (track) => {
          const videoData = await getYoutubeVideoId(
            track.S_NAME,
            track.S_ARTISTS[0].name,
          );
          return { ...track, YT_DATA: videoData };
        }),
      );

      updatedTracks = playlistTracks.map((track) => {
        const updatedTrack = fetchedData.find((t) => t.S_NAME === track.S_NAME);
        return updatedTrack || track;
      });
    } else if (type === "yt-search") {
      // const fetchedData = await Promise.all(
      await Promise.all(
        tracksNeedingUpdate.map(async (track) => {
          const query = `${track.S_NAME} ${track.S_ARTISTS[0].name}`;
          const response = await getPlaylistYTData(query);
          console.log("yt-api-cli", response);
          return { ...track, YT_DATA: response?.data };
        }),
      );

      updatedTracks = playlistTracks.map((track) => {
        // const idx = tracksNeedingUpdate.findIndex(
        tracksNeedingUpdate.findIndex((t) => t.S_NAME === track.S_NAME);
        return track;
      });
    }

    updateTracks(updatedTracks, selectedPlaylist);
    toast.success("Playlist Transified");
  } catch (err) {
    console.error("Error transifying playlist:", err);
    toast.error("Failed to transify playlist");
  }

  // router.push(`/Playlist/${selectedPlaylist}`);
  return true;
}
