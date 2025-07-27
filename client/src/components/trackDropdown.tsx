import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { IconBrandYoutube, IconBrandSpotify } from "@tabler/icons-react";
import { Button } from "./ui/button";

interface TrackDropdownProps {
  youtubeUrl: string;
  spotifyUrl: string;
}

const TrackDropdown: React.FC<TrackDropdownProps> = ({ youtubeUrl, spotifyUrl }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          ⋮
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          <DropdownMenuItem>
            <IconBrandYoutube className="text-red-500 size-5" />
            <span>YouTube</span>
          </DropdownMenuItem>
        </a>
        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
          <DropdownMenuItem>
            <IconBrandSpotify className="text-green-500 size-5" />
            <span>Spotify</span>
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TrackDropdown;
