import { YOUTUBE_DATA } from "./youtubeData";

export type S_IMG = {
    height: number;
    url: string;
    width: number;
};

export type TRACKS_LINKS = {
    href: string;
    total: number;
};

export type ARTIST = {
    external_urls: object;
    id: string;
    name: string;
    // href: string;
    // type: string;
    // uri: string;
};

export type ALBUM = {
    album_type: string;
    artists: object[];
    available_markets: string[];
    external_urls: object;
    href: string;
    id: string;
    images: S_IMG[];
    name: string;
    total_tracks: number;
    // release_date: string;
    // release_date_precision: string;
    // type: string;
    // uri: string;
};

export type TRACK = {
    S_TID: string;
    S_NAME: string;
    S_ARTISTS: ARTIST[];
    S_ALBUM: ALBUM;
    S_DURATION_MS: number;
    S_TRACK_NUMBER?: number;
    YT_DATA: YOUTUBE_DATA;
    // S_POPULARITY: number;
    // S_PREVIEW_URL: string;
};

export type PLAYLIST = {
    S_PID: string;
    S_NAME: string;
    S_TRACKS_LINKS: TRACKS_LINKS;
    S_TRACKS: TRACK[];
    S_IMAGES: S_IMG[];
    // S_HREF?: string;
    // S_OWNER?: object;
    // YT_DATA: YOUTUBE_DATA[];
};
