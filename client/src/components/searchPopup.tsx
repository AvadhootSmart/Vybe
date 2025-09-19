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
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { SearchSelect } from "./searchSelect";

interface SearchPopupProps {
  children: React.ReactNode;
  handleSelectTrack: (track: YOUTUBE_DATA) => void;
  className?: string;
}

export const SearchPopup = ({
  children,
  handleSelectTrack,
  className,
}: SearchPopupProps) => {
  const [query, setQuery] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [results, setResults] = useState<YOUTUBE_DATA[]>([]);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false); // fix: false by default
  const [searched, setSearched] = useState(false); // track if user has searched at least once
  const [searchType, setSearchType] = useState<"yt-api" | "yt-search">(
    "yt-search",
  );

  useEffect(() => {
    const token = localStorage.getItem("googleAccessToken");
    if (token) setGoogleToken(token);
  }, []);

  const handleSearch = async (type: "yt-api" | "yt-search") => {
    if (!googleToken) {
      toast.error("Google token not available");
      return;
    }

    setResults([]);
    setLoading(true);
    setSearched(true);

    try {
      if (type == "yt-search") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          },
        );

        const data = await response.json();
        // console.log("Search result", data);

        if (!data || data.length === 0) {
          toast.error("No YouTube video found for this track");
          setResults([]);
          return;
        }

        setResults(data);
      } else if (type == "yt-api") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/youtube/basic-search`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          },
        );

        const data = await response.json();
        // console.log("Search result", data);

        if (!data || data.length === 0) {
          toast.error("No YouTube video found for this track");
          setResults([]);
          return;
        }
        setResults(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
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

      if (!resp.ok) throw new Error("Failed to cache audio");

      toast.success("Track Added to queue");
      handleSelectTrack(track);
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
      <DialogContent className={cn("sm:max-w-[600px] w-full", className)}>
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-Poppins">
            Search Tracks
          </DialogTitle>
          <DialogDescription>
            Find a track to add to your queue
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for tracks, artists, or playlists..."
            className="flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchType)}
          />
          <Button
            onClick={() => handleSearch(searchType)}
            disabled={loading || query === ""}
          >
            Search
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="space-y-4">
              <Skeleton className="h-[80px]" />
            </CardContent>
          </Card>
        ) : searched && results.length === 0 ? (
          <p className="text-center text-gray-400">No results found</p>
        ) : (
          results.length > 0 && (
            <Card>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {results.map((item) => (
                  <ResultsCard
                    key={item.YT_VIDEO_ID}
                    item={item}
                    isLoading={addingIds.has(item.YT_VIDEO_ID)}
                    onAdd={selectTrack}
                  />
                ))}
              </CardContent>
            </Card>
          )
        )}

        <DialogFooter>
          <div className="flex gap-2 self-end w-full justify-between">
            <SearchSelect
              value={searchType}
              onChange={(value) => setSearchType(value)}
              triggerClassName="w-fit"
            />
            <DialogClose>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
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
        src={item.YT_IMAGE || "/apple-touch-icon.png"}
        alt={item.YT_TITLE}
        className="w-12 h-12 sm:w-20 sm:h-20 object-cover rounded-lg"
      />
      <h1 className="flex-1">{item.YT_TITLE}</h1>
      <Button onClick={() => onAdd(item)} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus />}
      </Button>
    </div>
  );
};
