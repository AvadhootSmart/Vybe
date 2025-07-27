// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import { Skeleton } from "./ui/skeleton";
// import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
// import { LucidePause, LucidePlay, LucideSkipForward } from "lucide-react";
// import { TRACK } from "@/types/playlist";
// // import AudioPlayer from "./audioPlayer";
// import { Button } from "./ui/button";
// // import { AnimatePresence, motion as m } from "motion/react";

// interface PlayerProps {
//   VideoIds: string[];
//   playlistTracks: TRACK[];
//   TrackIdx: number;
// }

// export const Player = ({ VideoIds, playlistTracks, TrackIdx }: PlayerProps) => {
//   const [playing, setPlaying] = useState<boolean>(false);
//   const [isLoaded, setIsLoaded] = useState<boolean>(false);
//   const [playingIdx, setPlayingIdx] = useState<number>(TrackIdx);

//   const playerRef = useRef<YouTubePlayer | null>(null);

//   const onReady = (event: YouTubeEvent) => {
//     playerRef.current = event.target;
//     setIsLoaded(true);
//   };

//   const onStateChange = (event: YouTubeEvent) => {
//     // if (event.data === 1) setPlaying(true);
//     // else setPlaying(false);
//     switch (event.data) {
//       case 1:
//         setPlaying(true);
//         break;
//       case 2:
//         setPlaying(false);
//         break;
//       case 0:
//         playNext();
//         break;
//     }
//   };

//   const playNext = () => {
//     if (playerRef.current && VideoIds.length > 0) {
//       const nextIdx = (playingIdx + 1) % VideoIds.length;
//       setPlayingIdx(nextIdx);

//       playerRef.current.loadVideoById(VideoIds[nextIdx]);
//     }
//   };

//   const togglePlay = () => {
//     if (playerRef.current) {
//       //eslint-disable-next-line
//       playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
//     }
//   };

//   const opts = {
//     width: "100%",
//     height: "100%",

//     playerVars: {
//       controls: 0,
//       modestbranding: 1,
//       rel: 0,
//       showinfo: 0,
//       autoplay: 1, // Auto-play next video
//     },
//   };

//   useEffect(() => {
//     if (playerRef.current && isLoaded) {
//       setPlayingIdx(TrackIdx);
//       playerRef.current.loadVideoById(VideoIds[TrackIdx]);
//     }
//   }, [VideoIds, TrackIdx]);

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (!playerRef.current) return;

//       switch (event.key) {
//         case " ":
//           togglePlay();
//           break;
//         case "ArrowRight":
//           playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5);
//           break;
//         case "ArrowLeft":
//           playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5);
//           break;
//         case "m":
//           if (playerRef.current.isMuted()) {
//             playerRef.current.unMute();
//           } else {
//             playerRef.current.mute();
//           }
//           break;
//         case "N":
//           playNext();
//           break;
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [playing]);

//   return (
//     <div className="p-2 bg-white/10 backdrop-blur-lg sm:backdrop-blur-3xl w-full flex font-Poppins rounded-xl justify-between items-center">
//       {/* Hidden YouTube Player */}
//       {/* <YouTube
//         videoId={VideoIds[playingIdx] || ""}
//         ref={playerRef}
//         opts={opts}
//         onReady={onReady}
//         className=""
//         onStateChange={onStateChange}
//       /> */}

//       {/* Track Info */}
//       <div className="flex gap-2 sm:flex hidden">
//         {playlistTracks.length > 0 ? (
//           <img
//             loading="lazy"
//             src={playlistTracks[playingIdx]?.S_ALBUM?.images?.[0]?.url}
//             alt="Album Cover"
//             className="size-20 rounded-lg"
//           />
//         ) : (
//           <Skeleton className="size-20 rounded-lg bg-zinc-700" />
//         )}

//         <div className="flex flex-col">
//           <h1 className="sm:text-sm text-xs font-semibold truncate">
//             {playlistTracks[playingIdx]?.S_NAME || "Unknown Track"}
//           </h1>
//           <h2 className="text-neutral-400 sm:text-xs text-xs truncate">
//             {playlistTracks[playingIdx]?.S_ARTISTS?.[0]?.name ||
//               "Unknown Artist"}
//           </h2>
//         </div>
//       </div>

//       {/* <AudioPlayer videoId={VideoIds[playingIdx]} /> */}
//       {/* Playback Controls */}
//       <div className="flex gap-2">
//         <Button
//           onClick={togglePlay}
//           className="cursor-pointer"
//           size="icon"
//           variant="default"
//           disabled={!isLoaded}
//         >
//           {playing ? (
//             <LucidePause className="size-2 sm:size-4" />
//           ) : (
//             <LucidePlay className="size-2 sm:size-4" />
//           )}
//         </Button>
//         <Button onClick={playNext} className="cursor-pointer" size="icon">
//           <LucideSkipForward className="size-2 sm:size-4" />
//         </Button>
//       </div>
//     </div>
//   );
// };
