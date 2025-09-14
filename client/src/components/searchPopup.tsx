"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { YOUTUBE_DATA } from "@/types/youtubeData";

interface SearchPopupProps {
  children: React.ReactNode; // trigger for the dialog
  handleSelectTrack: (track: YOUTUBE_DATA) => void;
}

export const SearchPopup = ({
  children,
  handleSelectTrack,
}: SearchPopupProps) => {
  // const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [results, setResults] = useState<YOUTUBE_DATA[]>([]);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("googleAccessToken");
    if (token) setGoogleToken(token);
  }, []);

  const handleSearch = async () => {
    if (!googleToken) {
      toast.error("Google token not available");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query }),
      },
    );

    const data = await response.json();
    console.log("Search result", data);

    if (data.length === 0) {
      toast.error("No YouTube video found for this track");
      return;
    }

    setResults(data);
  };

  const selectTrack = async (track: YOUTUBE_DATA) => {
    const id = track.YT_VIDEO_ID;
    if (addingIds.has(id)) return;

    setAddingIds((prev) => new Set(prev).add(id));

    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/transify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds: [id] }),
        },
      );

      if (!resp.ok) {
        throw new Error("Failed to cache audio");
      }

      toast.success("Track selected");
      handleSelectTrack(track); // send track back to parent
    } catch (e) {
      console.error("Error transifying video:", e);
      toast.error("Failed to prepare audio");
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-Poppins">
            Search Tracks
          </DialogTitle>
          <DialogDescription>
            Find a track to add to your queue
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for tracks, artists, or playlists..."
            className="flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <Card>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {results.length > 0 &&
              results.map((item, idx) => (
                <ResultsCard
                  key={idx}
                  item={item}
                  isLoading={addingIds.has(item.YT_VIDEO_ID)}
                  onAdd={selectTrack}
                />
              ))}
          </CardContent>
        </Card>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ResultsCard = ({
  item,
  onAdd,
  isLoading,
}: {
  item: YOUTUBE_DATA;
  onAdd: (item: YOUTUBE_DATA) => void;
  isLoading?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/apple-touch-icon.png"
        alt=""
        className="w-12 h-12 sm:w-20 sm:h-20 object-cover rounded-lg"
      />
      <h1 className="flex-1">{item.YT_TITLE}</h1>
      <Button onClick={() => onAdd(item)} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : <Plus />}
      </Button>
    </div>
  );
};
