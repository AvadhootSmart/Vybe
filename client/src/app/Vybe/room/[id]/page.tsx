"use client";
import { useEffect, useState } from "react";
import RoomPlayerPage from "@/components/ui/RoomPlayer";
import { useParams } from "next/navigation";

const RoomPage = () => {
  const { id } = useParams();
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (id) {
      const hostStatus = localStorage.getItem(`room_${id}_host`) === "true";
      setIsHost(hostStatus);
      console.log(hostStatus)
    }
  }, [id]);

  return (
    <div className="bg-neutral-950 w-full text-white h-screen">
      <div className="max-w-7xl mx-auto">
        {id && (
          <RoomPlayerPage
            roomID={id.toString()}
            isHost={isHost}
          />
        )}
      </div>
    </div>
  );
};

export default RoomPage;