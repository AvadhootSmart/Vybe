"use client";
import VideoPlayer from "@/components/VideoPlayer";
import usePlaylistStore from "@/store/playlistStore";
import { PLAYLIST, TRACK } from "@/types/playlist";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const page = () => {
    const { id } = useParams();
    const [currentPlaylist, setCurrentPlaylist] = useState<PLAYLIST>();
    const [playlistTracks, setPlaylistTracks] = useState<TRACK[]>([]);

    // setCurrentPlaylist(
    //     usePlaylistStore.getState().Playlists.filter((pl) => {
    //         return pl.S_PID === id;
    //     }),

    useEffect(() => {
        // setCurrentPlaylist(currPlaylist[0]);
        const currPlaylist = usePlaylistStore.getState().Playlists.filter((pl) => {
            return pl.S_PID === id;
        });
        console.log(currPlaylist);
        setCurrentPlaylist(currPlaylist[0]);
        setPlaylistTracks(currPlaylist[0].S_TRACKS);
    }, []);
    return (
        <>
            {currentPlaylist ? (
                <>
                    {playlistTracks.map((track: TRACK) => (
                        <div key={track.S_TID}>
                            <h1>Play Tracks</h1>
                            <div
                                className="w-full flex gap-2 items-center"
                                key={track.S_TID}
                            >
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
                        </div>
                    ))}
                </>
            ) : (
                <div>Loading..</div>
            )}
        </>
    );
};

export default page;
