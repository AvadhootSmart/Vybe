// import { cn } from "@/lib/utils";
import { TRACK } from "@/types/playlist";
import React from "react";

interface TrackCardProps {
    track: TRACK;
}
export const TrackCard = ({ track }: TrackCardProps) => {
    return (
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
    );
};
