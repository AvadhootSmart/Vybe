"use client";

import { Button } from "@/components/ui/button";
import { RoomPopup } from "@/components/popups/roomPopup";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-br from-purple-900 via-black to-neutral-950 flex justify-center">
      <div className="flex min-h-screen max-w-6xl flex-col items-center justify-center text-white px-6">
        {/* Branding */}
        {/* <header className="absolute top-8 left-1/2 -translate-x-1/2 text-center"> */}
        {/*   <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg"> */}
        {/*     Vybe */}
        {/*   </h1> */}
        {/*   <p className="mt-2 text-lg text-neutral-300"> */}
        {/*     Music hits different when you share the <span className="text-purple-400 font-semibold">Vybe</span>. */}
        {/*   </p> */}
        {/* </header> */}

        {/* Hero Section */}
        <main className="flex flex-col items-center text-center gap-8">
          <h2 className="max-w-2xl text-3xl font-bold md:text-4xl lg:text-5xl leading-tight">
            Listen to music <span className="text-purple-400">together</span>,
            anytime, anywhere.
          </h2>
          <p className="max-w-xl text-neutral-300 text-lg">
            Create{" "}
            <span className="text-purple-300 font-semibold">Vybe Rooms</span> to
            jam with your friends in real-time. Discover, share, and vibe to
            music like never before.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 mt-6 w-full max-w-sm">
            {/* Start Listening */}
            <Link href="/Vybe/player">
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-lg font-semibold"
              >
                🎧 Start Vybing
              </Button>
            </Link>

            <RoomPopup
              onCreate={(code) => router.push(`/Vybe/room/${code}`)}
              onJoin={(code) => router.push(`/Vybe/room/${code}`)}
            >
              <Button
                size="lg"
                variant="secondary"
                className="w-full dark bg-white/10 hover:bg-white/20 text-lg font-semibold"
              >
                👯 Start Listening with Friends
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
