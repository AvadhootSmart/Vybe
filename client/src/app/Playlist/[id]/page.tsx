"use client";
import React, { useEffect, useState } from "react";
import usePlaylistStore from "@/store/playlistStore";
import { PLAYLIST, TRACK } from "@/types/playlist";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LucideChevronLeft } from "lucide-react";
import { toast } from "sonner";
import AudioPlayer from "@/components/audioPlayer";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const PlaylistPage = () => {
    const { id } = useParams();
    const router = useRouter();

    const Playlists = usePlaylistStore((state) => state.Playlists);
    const [currentPlaylist, setCurrentPlaylist] = useState<PLAYLIST | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);
    const [trackIds, setTrackIds] = useState<string[]>([]);
    const [playingIdx, setPlayingIdx] = useState<number>(0);
    const [loadedTracks, setLoadedTracks] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchAudioTracks = async (trackIds: string[]) => {
        if (trackIds.length === 0) return;
        setLoading(true);

        // const accessToken = document.cookie
        //     .split("; ")
        //     .find((row) => row.startsWith("spotifyAccessToken="));

        const PlaylistLength = trackIds.length;

        const firstFewTrackIds =
            PlaylistLength > 3 ? trackIds.slice(0, 3) : trackIds.slice(0, 2);
        const remainingTrackIds = trackIds.slice(3);

        const initialResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/transify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ videoIds: firstFewTrackIds }),
            },
        );

        if (initialResponse.ok) {
            setLoadedTracks((prev) => [...prev, ...firstFewTrackIds]);
            setLoading(false);
            toast.success("First few tracks ready!!");
        }
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoIds: remainingTrackIds }),
        }).then((response) => {
            if (response.ok) {
                setLoadedTracks((prev) => [...prev, ...remainingTrackIds]);
                toast.success("Playlist Transified Completely");
            }
        });
    };

    //Fetches the current playlist from the store
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
            } else {
                setTrackIds([]);
                //When no YT_DATA is found in the playlist's tracks
                // toast.error("Something went wrong while transifying playlist");
                router.push("/Home?error=true");
            }
        }
    }, [id, Playlists]);

    //Fetches audio Tracks for all the tracks
    useEffect(() => {
        if (trackIds.length > 0) {
            fetchAudioTracks(trackIds);
        }
    }, [trackIds]);

    function isTrackAvailable(idx: string): boolean {
        return loadedTracks.includes(idx);
    }

    return (
        <div className="w-full min-h-screen flex flex-col gap-10 items-center font-Poppins bg-neutral-950 text-white py-8 px-2 lg:px-[20%] overflow-hidden relative">
            {loading ? (
                <Skeleton className="fixed bg-zinc-800 bottom-8 w-[90%] lg:w-[60%] "/>
            ) : (
                <div className="fixed z-50 bottom-8 w-[90%] lg:w-[60%] ">
                    <AudioPlayer
                        TrackIdx={playingIdx}
                        playlistTracks={playlistTracks}
                        VideoIds={trackIds}
                    />
                </div>
            )}
            <div className="fixed top-4 left-4 lg:top-10 lg:left-10">
                <Link href={`/Home`}>
                    <LucideChevronLeft className="size-8 sm:size-10" />
                </Link>
            </div>
            <div className="w-full h-[40%] mt-8 flex flex-col gap-4 justify-center items-center">
                {/* eslint-disable-next-line */}
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
                {playlistTracks.map((track: TRACK, idx: number) => (
                    // TODO: MAKE A COMPONENT FOR THIS AND STAGGER
                    // ANIMATE THEM
                    <div
                        key={track.S_TID}
                        role="button"
                        onClick={() => setPlayingIdx(idx)}
                        className={cn({
                            "cursor-pointer": isTrackAvailable(track.YT_DATA.YT_VIDEO_ID),
                            "opacity-50 cursor-not-allowed": !isTrackAvailable(
                                track.YT_DATA.YT_VIDEO_ID,
                            ),
                        })}
                    >
                        <div
                            className="w-full flex gap-2 items-center rounded-lg hover:bg-zinc-800 transition-all p-2"
                            key={track.S_TID}
                        >
                            {/* eslint-disable-next-line */}
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
