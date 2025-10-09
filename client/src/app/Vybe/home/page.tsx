"use client";

import { Button } from "@/components/ui/button";
import { RoomPopup } from "@/components/popups/roomPopup";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const handleCreateRoom = (roomID: string) => {
    localStorage.setItem(
      "roomSession",
      JSON.stringify({ code: roomID, role: "host" }),
    );

    router.push(`/Vybe/room/${roomID}`);
  };

  const handleJoinRoom = (code: string) => {
    if (localStorage.getItem("room_" + code + "_host")) {
      localStorage.removeItem("room_" + code + "_host");
    }
    localStorage.setItem(
      "roomSession",
      JSON.stringify({
        code,
        role: "guest",
      }),
    );
    router.push(`/Vybe/room/${code}`);
  };
  return (
    <div className="bg-gradient-to-t from-vybe via-black to-neutral-950 flex justify-center">
      <div className="flex min-h-screen max-w-6xl flex-col items-center justify-center text-white px-6">
        {/* Hero Section */}
        <main className="flex font-Poppins flex-col items-center text-center gap-8">
          <h2 className="max-w-2xl text-3xl font-bold md:text-4xl lg:text-5xl leading-tight">
            Listen to music <span className="text-vybe">together</span>,
            anytime, anywhere.
          </h2>
          <p className="max-w-xl text-neutral-300 text-lg">
            Create <span className="text-vybe font-semibold">Vybe Rooms</span>{" "}
            to jam with your friends in real-time. Discover, share, and vibe to
            music like never before.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 mt-6 w-full max-w-sm">
            {/* Start Listening */}
            <Link href="/Vybe/player">
              <Button
                size="lg"
                className="w-full bg-vybe text-black hover:bg-vybe/90 transition text-lg font-medium"
              >
                Start Vybing
              </Button>
            </Link>

            <RoomPopup
              onCreate={(code) => handleCreateRoom(code)}
              onJoin={(code) => handleJoinRoom(code)}
            >
              <Button
                size="lg"
                variant="secondary"
                className="w-full dark bg-white/10 hover:bg-white/20 transition text-lg font-medium"
              >
                Vybe with Friends
              </Button>
            </RoomPopup>
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} Vybe. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
