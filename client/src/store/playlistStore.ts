import { PLAYLIST, TRACK } from "@/types/playlist";
import { create } from "zustand";

type PlaylistStore = {
    Playlists: PLAYLIST[];
    storePlaylists: (playlists: PLAYLIST[]) => void;
    updatePlaylistStore: (playlist: PLAYLIST) => void;
    addPlaylistTracks: (tracks: TRACK[], PID: string) => void;
    updateTracks: (tracks: TRACK[], PID?: string) => void;
};

const usePlaylistStore = create<PlaylistStore>((set, get) => ({
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
    getPlaylist: (PID: string) => {
        return get().Playlists.find((playlist) => playlist.S_PID === PID);
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
                    ? {
                        ...playlist,
                        S_TRACKS: tracks,
                    }
                    : playlist,
            ),
        }));
    },
}));

export default usePlaylistStore;
