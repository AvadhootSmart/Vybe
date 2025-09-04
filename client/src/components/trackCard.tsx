import { TRACK } from "@/types/playlist";
import { Button } from "@/components/ui/button";
import { IconBrandSpotify, IconBrandYoutube } from "@tabler/icons-react";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/utils";
import TrackDropdown from "./trackDropdown";

interface TrackCardProps {
  track: TRACK;
  showDropdown?: boolean;
}
export const TrackCard = ({ track, showDropdown }: TrackCardProps) => {
  const spotifyUrl = `https://open.spotify.com/track/${track.S_TID}`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${track.YT_DATA.YT_VIDEO_ID}`;

  const isMobile = useIsMobile();

  return (
    <div
      className="w-full flex justify-between gap-2 items-center rounded-lg hover:bg-zinc-800 transition-all p-2"
      key={track.S_TID}
    >
      <div className="flex gap-2 items-center">
        {/* eslint-disable-next-line */}
        <img
          src={track.S_ALBUM.images[0].url || "/apple-touch-icon.png"}
          alt={track.S_NAME}
          className="size-12 sm:size-20 object-cover rounded-lg"
          width={100}
          height={100}
        />
        <div>
          <h1 className="sm:text-xl text-sm">{track.S_NAME || track.YT_DATA.YT_TITLE}</h1>
          <h2 className="sm:text-lg text-xs text-zinc-400">
            {track.S_ARTISTS[0].name || "Artist name"}
          </h2>
        </div>
      </div>
      {!isMobile && showDropdown && (
        <div className="flex gap-2 items-center">
          <p>
            {`${Math.floor(track.S_DURATION_MS / 60000)}:${String(
              Math.floor((track.S_DURATION_MS % 60000) / 1000)
            ).padStart(2, "0")}`}
          </p>
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-zinc-800 cursor-pointer"
            >
              <IconBrandYoutube className="text-red-500 size-8" />
            </Button>
          </a>

          <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-zinc-800 cursor-pointer"
            >
              <IconBrandSpotify className="text-green-500 size-8" />
            </Button>
          </a>
        </div>
      )}
      {isMobile && (
        <div className="flex gap-2 items-center">
          <p>{formatDuration(track.S_DURATION_MS)}</p>
          {showDropdown && (
            <TrackDropdown youtubeUrl={youtubeUrl} spotifyUrl={spotifyUrl} />
          )}
        </div>
      )}
    </div>
  );
};
