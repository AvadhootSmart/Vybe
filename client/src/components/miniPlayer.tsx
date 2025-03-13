import { useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component
import { TRACK } from "@/types/playlist";

interface MiniPlayerProps {
  playlistTracks: TRACK[];
  playingIdx: number;
}
export const MiniPlayer = ({ playlistTracks, playingIdx }: MiniPlayerProps) => {
  const [isPiP, setIsPiP] = useState(false);
  const pipRef = useRef(null);

  const track = playlistTracks[playingIdx];

  return (
    <div>
      {/* Normal View */}
      {!isPiP && (
        <div className="flex gap-2">
          {track?.S_ALBUM?.images?.[0]?.url ? (
            <img
              loading="lazy"
              src={track.S_ALBUM.images[0].url}
              alt="Album Cover"
              className="size-20 rounded-lg"
            />
          ) : (
            <Skeleton className="size-20 rounded-lg bg-zinc-700" />
          )}

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold">
              {track?.S_NAME || "Unknown Track"}
            </h1>
            <h2 className="text-neutral-400 text-xs">
              {track?.S_ARTISTS?.[0]?.name || "Unknown Artist"}
            </h2>
          </div>

          <button
            onClick={() => setIsPiP(true)}
            className="bg-blue-500 text-white px-2 py-1 rounded-md"
          >
            Enable PiP
          </button>
        </div>
      )}

      {/* PiP Mode */}
      {isPiP && (
        <div
          ref={pipRef}
          className="fixed bottom-5 right-5 p-2 bg-black rounded-lg shadow-lg flex items-center gap-2 transition-all"
        >
          {track?.S_ALBUM?.images?.[0]?.url ? (
            <img
              loading="lazy"
              src={track.S_ALBUM.images[0].url}
              alt="Album Cover"
              className="size-16 rounded-lg"
            />
          ) : (
            <Skeleton className="size-16 rounded-lg bg-zinc-700" />
          )}

          <div className="flex flex-col">
            <h1 className="text-xs font-semibold">
              {track?.S_NAME || "Unknown Track"}
            </h1>
            <h2 className="text-neutral-400 text-xs">
              {track?.S_ARTISTS?.[0]?.name || "Unknown Artist"}
            </h2>
          </div>

          <button
            onClick={() => setIsPiP(false)}
            className="text-white bg-red-500 px-2 py-1 rounded-md"
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniPlayer;
