"use client";
import { PlaylistCard } from "@/components/playlistCard";
import { PlaylistPopup } from "@/components/playlistPopup";
import { Button } from "@/components/ui/button";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import usePlaylistStore from "@/store/playlistStore";
import { LucideSettings2 } from "lucide-react";
// import { ARTIST, TRACK } from "@/types/playlist";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function Home() {
    const router = useRouter();

    // Get Zustand store actions and state
    const { Playlists, addPlaylistTracks } = usePlaylistStore();

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

    async function getYoutubeVideoId(
        trackName: string,
        artistName: string,
    ): Promise<{ YT_TITLE: string; YT_VIDEO_ID: string }> {
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

    function ClearLocalStorage() {
        localStorage.clear();
        toast.success("Local Storage Cleared");
        window.location.reload();
    }

    useEffect(() => {
        if (!spotifyAccessToken) return;
        fetchPlaylists();
    }, [spotifyAccessToken]);

    // const searchParams = useSearchParams();

    // useEffect(() => {
    //     if (searchParams.get("error") === "true") {
    //         toast.error(
    //             "Something went wrong while transifying playlist, Clear Cache and try again later",
    //         );

    //         const newParams = new URLSearchParams(searchParams.toString());
    //         newParams.delete("error");
    //         router.replace(`/?${newParams.toString()}`, { scroll: false });
    //     }
    // }, [searchParams, router]);

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
                    <div className="grid md:grid-cols-4 gap-4">
                        {Playlists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.S_PID}
                                playlist={playlist}
                                getTracks={() => getPlaylistItemsByPID(playlist.S_PID)}
                            // setSelectedPlaylist={setSelectedPlaylist}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
