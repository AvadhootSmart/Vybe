#!/usr/bin/env python3
import argparse
import json
from ytmusicapi import YTMusic

# ytmusic = YTMusic()
# search_result = ytmusic.search("Billie Eilish - Bad Guy", filter="songs", limit=1)

# print(json.dumps(search_result, ensure_ascii=False, indent=2))

def search_song(query, limit=1):
    ytmusic = YTMusic()
    results = ytmusic.search(query, filter="songs", limit=limit)

    output = []
    for result in results:
        output.append({
            "title": result["title"],
            "artists": [artist["name"] for artist in result.get("artists", [])],
            "videoId": result["videoId"],
            "duration": result["duration"],
            "images": result["thumbnails"]
        })

    print(json.dumps(output, ensure_ascii=False, indent=2))

def main():
    parser = argparse.ArgumentParser(description="YouTube Music CLI using ytmusicapi")
    parser.add_argument("--search", type=str, required=True, help="Search query (song title and artist)")
    parser.add_argument("--limit", type=int, default=1, help="Number of results to return")

    args = parser.parse_args()
    search_song(args.search, args.limit)

if __name__ == "__main__":
    main()
