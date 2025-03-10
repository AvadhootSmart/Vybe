import { PLAYLIST, TRACK } from "@/types/playlist";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type PlaylistStore = {
    Playlists: PLAYLIST[];
    storePlaylists: (playlists: PLAYLIST[]) => void;
    updatePlaylistStore: (playlist: PLAYLIST) => void;
    addPlaylistTracks: (tracks: TRACK[], PID: string) => void;
    updateTracks: (tracks: TRACK[], PID?: string) => void;
};

const usePlaylistStore = create<PlaylistStore>()(
    persist(
        (set) => ({
            Playlists: [],

            storePlaylists: (playlists) => {
                set({ Playlists: playlists });
            },

            updatePlaylistStore: (playlist) => {
                set((state) => ({
                    Playlists: state.Playlists.map((p) =>
                        p.S_PID === playlist.S_PID ? playlist : p,
                    ),
                }));
            },

            addPlaylistTracks: (tracks, PID) => {
                set((state) => ({
                    Playlists: state.Playlists.map((playlist) =>
                        playlist.S_PID === PID
                            ? {
                                ...playlist,
                                S_TRACKS: [...(playlist.S_TRACKS || []), ...tracks],
                            }
                            : playlist,
                    ),
                }));
            },

            updateTracks: (tracks, PID) => {
                set((state) => ({
                    Playlists: state.Playlists.map((playlist) =>
                        playlist.S_PID === PID
                            ? { ...playlist, S_TRACKS: tracks }
                            : playlist,
                    ),
                }));
            },
        }),
        {
            name: "playlist-store", // Unique key for localStorage
        },
    ),
);

export default usePlaylistStore;
