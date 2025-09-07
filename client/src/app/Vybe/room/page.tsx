"use client";
import RoomCard from "@/components/RoomCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const RoomSelectPage = () => {
  const router = useRouter();

  const handleCreateRoom = (roomID?: string) => {
    if (roomID) {
      router.push(`/Vybe/room/${roomID}?H`);
    } else {
      toast.error("Error creating room, no room ID provided");
    }
  };

  const handleJoinRoom = (roomID?: string) => {
    if (roomID) {
      router.push(`/Vybe/room/${roomID}`);
    } else {
      toast.error("Error joining room, no room ID provided");
    }
  };

  return (
    <div className="bg-neutral-950 w-full text-white h-screen">
      <div className="flex h-full items-center justify-center max-w-7xl mx-auto">
        <RoomCard
          onCreate={(roomID) => handleCreateRoom(roomID ? roomID : "")}
          onJoin={(roomID) => handleJoinRoom(roomID ? roomID : "")}
        />
      </div>
    </div>
  );
};

export default RoomSelectPage;
