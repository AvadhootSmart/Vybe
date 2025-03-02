import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../SocketContext";
import { toast } from "react-toastify";

function JoinRoom() {
  const socket = useSocket();
  // const navigateTo = useNavigate();

  const [Room, setRoom] = useState("");

  const handleSubmit = (e) => {
    try {
      e.preventDefault();
      socket.emit("joinRoom", Room);
      toast.success(`${socket.id} joined room ${Room}`);
      console.log(socket.id + `joined room ${Room}`);

      // navigateTo(`/Rooms/${Room}`);
    } catch (error) {
      console.log("Some error occurred", error);
    }
  };

  return (
    <>
      <div className="h-[20vh] w-full">
        <input
          type="text"
          className="p-3 m-20 border-4 border-black  rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter Room Name"
          value={Room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button
          type="submit"
          onClick={handleSubmit}
          className="p-3 m-20 border-4 border-black  rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          Join
        </button>
      </div>
    </>
  );
}

export default JoinRoom;
