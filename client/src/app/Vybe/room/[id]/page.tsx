"use client";
import { useEffect, useState } from "react";
import RoomPlayerPage from "@/components/ui/RoomPlayer";

const RoomPage = () => {
  const [isHost, setIsHost] = useState(false);
  const [roomID, setRoomID] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("roomSession");
    const roomID = session ? JSON.parse(session).code : "";
    if (roomID) {
      // const hostStatus = localStorage.getItem(`room_${id}_host`) === "true";
      const hostStatus = session ? JSON.parse(session).role === "host" : false;
      setIsHost(hostStatus);
      setRoomID(roomID);
    }
  }, []);

  return (
    <div className="bg-neutral-950 w-full text-white h-screen">
      <div className="max-w-7xl mx-auto">
        {roomID && <RoomPlayerPage roomID={roomID} isHost={isHost} />}
      </div>
    </div>
  );
};

export default RoomPage;
