"use client";
import { PlaylistCard } from "@/components/playlistCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/VideoPlayer";
import usePlaylistStore from "@/store/playlistStore";
import { ARTIST, PLAYLIST, TRACK } from "@/types/playlist";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// import { toast } from "react-toastify";
// import SpotifyWebApi from "spotify-web-api-node";

// const SpotifyApi = new SpotifyWebApi({
//     clientId: process.env.SPOTIFY_CLIENT_ID,
//     clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
//     redirectUri: `${process.env.BACKEND_URL}/auth/spotify/callback`,
// });

function Home() {
    const router = useRouter();

    const [spotifyAccessToken, setSpotifyAccessToken] = useState<string>("");
    const [googleToken, setGoogleToken] = useState<string>("");

    const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);
    const [playlists, setPlaylists] = useState<PLAYLIST[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [youtubeData, setYoutubeData] = useState<YOUTUBE_DATA[]>([]);

    const { storePlaylists, updateTracks, addPlaylistTracks } =
        usePlaylistStore();

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
            // SpotifyApi.setAccessToken(spotifyToken);
        }
    }, []);

    const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
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
            setPlaylists(data);
            storePlaylists(data);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            toast.error("Failed to fetch playlists");
        } finally {
            setIsLoading(false);
        }
    };

    const getPlaylistItemsByPID = async (PID: string) => {
        const response = await fetch(
            `${process.env.BACKEND_URL || "http://localhost:5000"}/spotify/playlist/${PID}`,
            {
                headers: {
                    Authorization: `Bearer ${spotifyAccessToken}`,
                },
            },
        );

        const data = await response.json();

        setPlaylistTracks(data);
        addPlaylistTracks(data, PID);
        console.log(
            "playlistStore-addPlaylistTracks",
            usePlaylistStore.getState().Playlists,
        );
        setSelectedPlaylist(PID);
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

        youtubeData.push({
            YT_TITLE: data[0].YT_TITLE,
            YT_VIDEO_ID: data[0].YT_VIDEO_ID,
        });

        setYoutubeData(youtubeData);
    }

    async function transifyPlaylist(playlistTracks: TRACK[]) {
        if (youtubeData) {
            setYoutubeData([]);
        }
        playlistTracks.forEach(async (track) => {
            await getYoutubeVideoId(track.S_NAME, track.S_ARTISTS[0].name).then(
                () => {
                    toast.success("Playlist Transified");
                    // updates YT_DATA for every track in the playlist

                    playlistTracks.forEach((track) => {
                        track.YT_DATA = {
                            YT_TITLE: youtubeData[0].YT_TITLE,
                            YT_VIDEO_ID: youtubeData[0].YT_VIDEO_ID,
                        };
                    });
                    updateTracks(playlistTracks, selectedPlaylist);
                    router.push(`/Player/${selectedPlaylist}`);


                    //sets the playlistTracks with YT_DATA to the playlist
                    // setPlaylists((prevPlaylists) =>
                    //     prevPlaylists.map((playlist) =>
                    //         playlist.S_PID === selectedPlaylist
                    //             ? { ...playlist, S_TRACKS: playlistTracks }
                    //             : playlist,
                    //     ),
                    // );
                },
            );
        });
    }

    useEffect(() => {
        if (!spotifyAccessToken) return;
        fetchPlaylists();
    }, [spotifyAccessToken]);

    // useEffect(() => {
    //   console.log("playlists", playlists);
    // }, [playlists]);

    return (
        <div className="bg-neutral-950 w-[100%] min-h-screen text-white p-4 font-Poppins">
            <div
                className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 ${selectedPlaylist ? "" : "hidden"
                    }`}
            >
                <div className="bg-zinc-900 p-6 rounded-lg w-[80%] max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Playlist Tracks</h2>
                        <div className="flex items-center gap-4">
                            <Button
                                className="bg-zinc-500 text-white p-2 rounded-md"
                                onClick={() => transifyPlaylist(playlistTracks)}
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
                        {playlistTracks.map((track: TRACK) => (
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
                        <Skeleton className="size-[300px] sm:w-full bg-zinc-800 rounded-2xl" />
                        <Skeleton className="size-[300px] sm:w-full bg-zinc-800 rounded-2xl" />
                        <Skeleton className="size-[300px] sm:w-full bg-zinc-800 rounded-2xl" />
                        <Skeleton className="size-[300px] sm:w-full bg-zinc-800 rounded-2xl" />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-4 gap-4">
                        {playlists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.S_PID}
                                playlist={playlist}
                                getTracks={(PID: string) => getPlaylistItemsByPID(PID)}
                            />
                        ))}
                    </div>
                )}
            </div>
            {/* https://www.youtube.com/watch?v=M-mT5E7Ol2A&list=PLgznSM5fUa9Moefq9Z7afKyi5FPQRtyM1&index=6 */}
            {youtubeData.length > 0 && (
                <div className="min-h-screen mt-10 flex flex-col gap-10">
                    <h1>Play Tracks</h1>
                    {playlistTracks?.map((track: TRACK) => (
                        <div className="w-full flex gap-2 items-center" key={track.S_TID}>
                            {/* <VideoPlayer videoId={"M-mT5E7Ol2A"} /> */}
                            <VideoPlayer videoId={track.YT_DATA.YT_VIDEO_ID} />
                            <img
                                src={track.S_ALBUM.images[0].url}
                                alt={track.S_NAME}
                                className="size-20 object-cover rounded-lg"
                            />
                            <div>
                                <h1 className="text-xl">{track.S_NAME}</h1>
                                <h2 className="text-lg text-zinc-400">
                                    {track.S_ARTISTS[0].name}
                                </h2>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;
