import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node-updated";
import { toast } from "react-toastify";

const SpotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${import.meta.env.BACKEND_URL}/auth/spotify/callback`,
});

function Home() {
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [listMetaData, setListMetaData] = useState({});
  const [youtubeData, setYoutubeData] = useState([]);

  useEffect(() => {
    // Check if document.cookie exists and is not empty
    if (!document.cookie) {
      console.log("No cookies found");
      return;
    }

    // Safely get tokens from cookies
    const googleTokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googleAccessToken="));

    const spotifyTokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("spotifyAccessToken="));

    if (googleTokenCookie) {
      const googleToken = googleTokenCookie.split("=")[1];
      setGoogleToken(googleToken);
    }

    if (spotifyTokenCookie) {
      const spotifyToken = spotifyTokenCookie.split("=")[1];
      setSpotifyAccessToken(spotifyToken);
      SpotifyApi.setAccessToken(spotifyToken);
    }
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.BACKEND_URL}/spotify/playlists`,
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch playlists");
      }
      const data = await response.json();
      setPlaylists(data.items);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to fetch playlists");
    }
  };

  const getPlaylistItems = async (playlistId) => {
    const response = await fetch(
      `${import.meta.env.BACKEND_URL}/spotify/playlist/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      }
    );

    const data = await response.json();
    const metaData = formatTracklist(data.items);
    setListMetaData(metaData);
    // console.log(metaData);
    setPlaylistTracks(data.items);
    setSelectedPlaylist(playlistId);
  };

  function formatTracklist(tracklist) {
    return tracklist.map((track) => ({
      // id: track.track.id,
      name: track.track.name,
      artists: track.track.artists.map((artist) => artist.name),
      album: track.track.album.name,
    }));
  }

  async function getYoutubeVideoId(trackName, artistName) {
    const response = await fetch(
      `${import.meta.env.BACKEND_URL}/youtube/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackName, artistName }),
      }
    );
    const data = await response.json();

    youtubeData.push({
      name: data.items[0].snippet.title,
      id: data.items[0].id.videoId,
    });

    setYoutubeData(youtubeData);
  }

  async function transifyPlaylist(playlistTracks) {
    setYoutubeData([]);
    playlistTracks.forEach(async (track) => {
      await getYoutubeVideoId(
        track.track.name,
        track.track.artists[0].name
      ).then(() => {
        console.log(youtubeData);
      });
    });
  }

  async function createYtPlaylist(playlistTracks) {
    const response = await fetch(
      `${import.meta.env.BACKEND_URL}/youtube/createPlaylist`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ytPlaylistName: selectedPlaylist.name,
        }),
      }
    );
    const data = await response.json();
    console.log(data);
  }

  return (
    <div className="bg-zinc-800 w-[100%] h-screen text-white p-4">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
          selectedPlaylist ? "" : "hidden"
        }`}
      >
        <div className="bg-zinc-900 p-6 rounded-lg w-[80%] max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Playlist Tracks</h2>
            <div className="flex items-center gap-2">
              {/* <button className="bg-zinc-500 text-white p-2 rounded-md" onClick={() => transifyPlaylist(playlistTracks)}>Transify playlist</button> */}
              <button
                className="bg-zinc-500 text-white p-2 rounded-md"
                onClick={() => createYtPlaylist(playlistTracks)}
              >
                Create Youtube Playlist
              </button>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {playlistTracks.map((track) => (
              <div
                key={track.track.id}
                className="flex items-center space-x-4 p-2 hover:bg-zinc-800 rounded"
              >
                {track.track.album.images[0] && (
                  <img
                    src={track.track.album.images[0].url}
                    alt={track.track.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{track.track.name}</p>
                  <p className="text-gray-400">
                    {track.track.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={fetchPlaylists}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Fetch Playlists
        </button>
        <a
          href={`${import.meta.env.BACKEND_URL}/auth/google`}
          className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
        >
          Sign in with google
        </a>
        <h2 className="text-xl font-bold mb-4">Your Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-zinc-700 p-4 rounded-lg cursor-pointer hover:scale-105 transition-all duration-100"
              onClick={() => getPlaylistItems(playlist.id)}
            >
              <h3 className="font-semibold">{playlist.name}</h3>
              {/* <h3 className="font-semibold">{playlist.id}</h3> */}
              {playlist.images[0] && (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-full h-48 object-cover rounded mt-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
