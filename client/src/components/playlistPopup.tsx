import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useMediaQuery from "@/hooks/use-media-query";
import usePlaylistStore from "@/store/playlistStore";
import { ARTIST, TRACK } from "@/types/playlist";
import { LucideX, Music2 } from "lucide-react";
import { SearchSelect } from "./searchSelect";

interface PlaylistPopupProps {
  isOpen: boolean;
  selectedPlaylist: string;
  setSelectedPlaylist: (playlist: string) => void;
  transifyPlaylist: (searchType: "yt-api" | "yt-search") => void;
}

export function PlaylistPopup({
  isOpen,
  selectedPlaylist,
  setSelectedPlaylist,
  transifyPlaylist,
}: PlaylistPopupProps) {
  const { Playlists } = usePlaylistStore();
  const [open, setOpen] = React.useState(isOpen);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [searchType, setSearchType] = React.useState<"yt-api" | "yt-search">(
    "yt-api",
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // Reset selectedPlaylist when the dialog/drawer is closed
  React.useEffect(() => {
    if (!open) {
      setSelectedPlaylist("");
    }
  }, [open, setSelectedPlaylist]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-w-[60vw] dark font-Poppins">
          <DialogHeader className="flex text-white">
            <div className="flex w-full justify-between">
              <DialogTitle className="text-white text-2xl">
                Playlist Tracks
              </DialogTitle>
              <div className="flex gap-4 items-center">
                <SearchSelect value={searchType} onChange={setSearchType} />
                <Button
                  onClick={() => {
                    transifyPlaylist(searchType);
                    setIsLoading(true);
                  }}
                  disabled={isLoading}
                  className="w-fit"
                >
                  Transify
                </Button>
                <DialogClose>
                  <LucideX className="hover:scale-110 transition-all" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[80vh] flex flex-col gap-4 overflow-y-auto">
            {Playlists.find(
              (pl) => pl.S_PID === selectedPlaylist,
            )?.S_TRACKS.map((track: TRACK) => (
              <div
                key={track.S_TID}
                className="flex items-center space-x-4 p-2 hover:bg-zinc-800 rounded"
              >
                {track.S_ALBUM.images[0] && (
                  <img
                    loading="lazy"
                    src={track.S_ALBUM.images[0].url}
                    alt={track.S_NAME}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-white">{track.S_NAME}</p>
                  <p className="text-gray-400">
                    {track.S_ARTISTS.map((artist: ARTIST) => artist.name).join(
                      ", ",
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-neutral-950 dark font-Poppins px-4">
        <DrawerHeader className="px-2">
          <div className="flex w-full justify-between items-center">
            <DrawerTitle className="text-white text-xl">
              Playlist Tracks
            </DrawerTitle>
            <div className="flex gap-4">
              <SearchSelect value={searchType} onChange={setSearchType} />
              <Button
                onClick={() => transifyPlaylist(searchType)}
                className="w-fit"
              >
                <Music2 className="hover:scale-110 transition-all" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <div className="max-h-[65vh] overflow-y-auto space-y-4">
          {Playlists.find((pl) => pl.S_PID === selectedPlaylist)
            ?.S_TRACKS.slice()
            .reverse()
            .map((track: TRACK) => (
              <div
                key={track.S_TID}
                className="flex items-center space-x-4 p-2 hover:bg-zinc-800 rounded"
              >
                {track.S_ALBUM.images[0] && (
                  <img
                    loading="lazy"
                    src={track.S_ALBUM.images[0].url}
                    alt={track.S_NAME}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-white">{track.S_NAME}</p>
                  <p className="text-gray-400">
                    {track.S_ARTISTS.map((artist: ARTIST) => artist.name).join(
                      ", ",
                    )}
                  </p>
                </div>
              </div>
            ))}
        </div>

        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="default">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
