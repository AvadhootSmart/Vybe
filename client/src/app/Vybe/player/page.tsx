"use client";
import YoutubePlayer from "@/components/youtubePlayer";
import { YOUTUBE_DATA } from "@/types/youtubeData";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const ExplorePage = () => {
  const [googleToken, setGoogleToken] = useState("");
  const [selectedTrackItem, setSelectedTrackItem] = useState<
    YOUTUBE_DATA | undefined
  >();

  async function getUser() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${googleToken}`,
      },
    });
    const data = await response.json();
    return data;
  }

  useEffect(() => {
    const token = localStorage.getItem("googleAccessToken");
    if (token) setGoogleToken(token);
  }, []);

  useEffect(() => {
    if (googleToken) {
      getUser();
    }
  }, [googleToken]);

  return (
    <div className="w-full min-h-screen flex flex-col gap-10 items-center justify-center font-Poppins bg-neutral-950 text-white py-8 px-2 lg:px-[20%] overflow-hidden relative">
      <Image
        src="/apple-touch-icon.png"
        alt=""
        className="size-[70%] sm:size-[40%] mb-[10vh] object-cover rounded-lg"
        width={1000}
        height={1000}
      />
      {/* <div className="w-[90%] lg:w-[80%] "> */}
      {/*   <SearchPopup handleSelectTrack={(item) => setSelectedTrackItem(item)}> */}
      {/*     <button type="button"> search</button> */}
      {/*   </SearchPopup> */}
      {/* </div> */}
      <div className="fixed z-50 bottom-8 w-[90%] lg:w-[80%] ">
        <YoutubePlayer
          track={selectedTrackItem}
          onSelectTrack={setSelectedTrackItem}
        />
      </div>
    </div>
  );
};

export default ExplorePage;
