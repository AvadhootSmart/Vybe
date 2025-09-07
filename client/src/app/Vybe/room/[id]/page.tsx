"use client";
import RoomPlayer from "@/components/ui/RoomPlayer";
import { useParams, useSearchParams } from "next/navigation";

const RoomPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isHost = searchParams.has("H"); //TODO:temporarily using, make it more robust
  return (
    <div className="bg-neutral-950 w-full text-white h-screen">
      <div className="max-w-7xl text-center mx-auto">
        <h1>Room {id}</h1>
        {id && <RoomPlayer roomID={id?.toString()} isHost={isHost} />}
      </div>
    </div>
  );
};

export default RoomPage;
