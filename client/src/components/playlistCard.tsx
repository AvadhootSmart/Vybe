import { PLAYLIST } from "@/types/playlist";
import { LucidePlayCircle } from "lucide-react";
import React from "react";

interface PlaylistCardProps {
    playlist: PLAYLIST;
    getTracks: (PID: string) => void;
}

export const PlaylistCard = ({ playlist, getTracks }: PlaylistCardProps) => {
    return (
        <>
            <div className="relative z-0">
                {/* gradient layer */}
                <div className="absolute top-0 left-0 bg-gradient-to-t from-black via-black/70 to-transparent size-full overflow-hidden rounded-2xl flex justify-start items-end p-8">
                    <div className="w-full flex justify-between items-center">
                        <div>
                            <h1 className="font-semibold text-3xl font-Poppins">
                                {playlist.S_NAME}
                            </h1>
                            <h4 className="text-zinc-400">
                                {playlist.S_TRACKS_LINKS.total} tracks
                            </h4>
                        </div>
                        <button
                            className="text-white/70 hover:text-white hover:scale-105 transition-all duration-100"
                            onClick={() => getTracks(playlist.S_PID)}
                        >
                            <LucidePlayCircle className="size-16 font-semibold" />
                        </button>
                    </div>
                </div>
                {/* gradient layer ends */}
                <div className="overflow-hidden rounded-2xl">
                    <img
                        src={playlist.S_IMAGES[0].url}
                        alt={playlist.S_NAME}
                        className={
                            "w-full cursor-pointer hover:scale-105 transition-all duration-100 object-cover"
                        }
                    />
                </div>
            </div>
        </>
    );
};

// export default playlistCard
