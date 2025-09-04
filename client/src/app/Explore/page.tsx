'use client';
import AudioPlayer from '@/components/audioPlayer';
// import { TrackCard } from '@/components/trackCard';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input'
import YoutubePlayer from '@/components/youtubePlayer';
import { YOUTUBE_DATA } from '@/types/youtubeData';
import { Plus, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const page = () => {
    const [query, setQuery] = useState("")
    const [googleToken, setGoogleToken] = useState("")
    const [results, setResults] = useState<YOUTUBE_DATA[]>([]);
    const [videoIds, setVideoIds] = useState<string[]>([]);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    const [selectedTrackItem, setSelectedTrackItem] = useState<YOUTUBE_DATA | undefined>();

    useEffect(() => {
        const token = localStorage.getItem("googleAccessToken")
        if (token) setGoogleToken(token);
    }, [])



    const handleSearch = async () => {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/explore/search`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${googleToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            }
        );
        const data = await response.json();

        if (data.length === 0) {
            toast.error("No YouTube video found for this track");
            return {
                YT_TITLE: "",
                YT_VIDEO_ID: "",
            };
        }

        setResults(data);

        // return {
        //     YT_TITLE: data[0].YT_TITLE,
        //     YT_VIDEO_ID: data[0].YT_VIDEO_ID,
        // };
    }

    const addTrackToQueue = async () => {
        if (!selectedTrackItem) {
            toast.error("No track selected");
            return;
        }
        const id = selectedTrackItem.YT_VIDEO_ID;
        if (videoIds.includes(id)) return;
        if (addingIds.has(id)) return;
        setAddingIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/transify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoIds: [id] })
            });

            if (!resp.ok) {
                throw new Error("Failed to cache audio");
            }

            setVideoIds((prev) => [...prev, id]);
            toast.success("Added to queue");
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
    }
    return (
        <div className="w-full min-h-screen flex flex-col gap-10 items-center font-Poppins bg-neutral-950 text-white py-8 px-2 lg:px-[20%] overflow-hidden relative">
            <div className="w-full">
                <h1 className="text-3xl font-bold mb-6">Explore</h1>
                <div className="flex gap-2 mb-6">
                    <Input
                        type="text"
                        placeholder="Search for tracks, artists, or playlists..."
                        className="flex-1"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button onClick={handleSearch}>
                        Search
                    </Button>
                </div>
                <Card className="">
                    <CardContent className='space-y-4'>
                        {results.map((item, idx) => (
                            <ResultsCard
                                key={idx}
                                item={item}
                                isLoading={addingIds.has(item.YT_VIDEO_ID)}
                                onAdd={(it) => { setSelectedTrackItem(it); addTrackToQueue(); }}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="fixed z-50 bottom-8 w-[90%] lg:w-[80%] ">
                <YoutubePlayer track={selectedTrackItem} />
            </div>
        </div>
    )
}

const ResultsCard = ({ item, onAdd, isLoading }: { item: { YT_TITLE: string, YT_VIDEO_ID: string }, onAdd: (item: YOUTUBE_DATA) => void, isLoading?: boolean }) => {
    return (
        <div>
            <div className='flex items-center gap-2'>
                <img src="/apple-touch-icon.png" alt=""
                    className="size-12 sm:size-20 object-cover rounded-lg"
                />
                <h1 className='flex-1'>{item.YT_TITLE}</h1>
                <Button onClick={() => onAdd(item)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Plus />}
                </Button>
            </div>
        </div>
    );
}

export default page