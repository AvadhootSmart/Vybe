package main

import (
	// "bytes"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

// Super crappy code, I know, cleaning chores will be done on initial release

const audioDir = "./songs"

var redisClient = redis.NewClient(&redis.Options{
	Addr:     "localhost:6379",
	Password: "",
	DB:       0,
})

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	YOUTUBE_API_KEY := os.Getenv("YOUTUBE_API_KEY")

	app := fiber.New()
	client := resty.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Use(logger.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Get("/spotify/playlists", func(c *fiber.Ctx) error {
		// Extract Authorization header
		authHeader := c.Get("Authorization")
		// log.Println(authHeader)
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No access token provided"})
		}

		// Make request to Spotify API
		resp, err := client.R().
			SetHeader("Authorization", authHeader).
			Get("https://api.spotify.com/v1/me/playlists")

		if err != nil {
			log.Fatalf("Error fetching playlists:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch playlists"})
		}

		// Parse response
		var result struct {
			Items []struct {
				Name   string `json:"name"`
				PID    string `json:"id"`
				Images []struct {
					Height int    `json:"height"`
					Width  int    `json:"width"`
					URL    string `json:"url"`
				} `json:"images"`
				TracksLinks struct {
					Href  string `json:"href"`
					Total int    `json:"total"`
				} `json:"tracks"`
			} `json:"items"`
		}

		if err := json.Unmarshal(resp.Body(), &result); err != nil {
			log.Println("Error parsing response:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse playlists"})
		}

		// Format response
		formattedPlaylists := make([]fiber.Map, len(result.Items))
		for i, playlist := range result.Items {
			formattedPlaylists[i] = fiber.Map{
				"S_NAME":         playlist.Name,
				"S_PID":          playlist.PID,
				"S_IMAGES":       playlist.Images,
				"S_TRACKS_LINKS": playlist.TracksLinks,
			}
		}

		return c.JSON(formattedPlaylists)
	})

	//Get playlist's Tracks
	app.Get("/spotify/playlist/:PID", func(c *fiber.Ctx) error {
		PID := c.Params("PID")
		authHeader := c.Get("Authorization")

		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		reqUrl := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", PID)
		resp, err := client.R().
			SetHeader("Authorization", authHeader).
			Get(reqUrl)

		if err != nil {
			log.Fatalf("Error fetching playlist's tracks:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch playlist's tracks"})
		}

		var result struct {
			Items []struct {
				Track struct {
					ID          string      `json:"id"`
					Name        string      `json:"name"`
					Artists     interface{} `json:"artists"`
					Album       interface{} `json:"album"`
					DurationMS  int         `json:"duration_ms"`
					TrackNumber int         `json:"track_number"`
				} `json:"track"`
			} `json:"items"`
		}

		if err := json.Unmarshal(resp.Body(), &result); err != nil {
			log.Println("Error parsing response:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse playlist's tracks"})
		}

		formattedTracks := make([]fiber.Map, len(result.Items))
		for i, track := range result.Items {
			formattedTracks[i] = fiber.Map{
				"S_TID":          track.Track.ID,
				"S_NAME":         track.Track.Name,
				"S_ARTISTS":      track.Track.Artists,
				"S_ALBUM":        track.Track.Album,
				"S_DURATION_MS":  track.Track.DurationMS,
				"S_TRACK_NUMBER": track.Track.TrackNumber,
			}
		}

		return c.JSON(formattedTracks)
	})

	app.Post("/youtube/search", func(c *fiber.Ctx) error {
		type SearchRequest struct {
			TrackName  string `json:"trackName"`
			ArtistName string `json:"artistName"`
		}

		sq := new(SearchRequest)
		if err := c.BodyParser(sq); err != nil {
			log.Println("Error parsing request body:", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
		}

		trackName := url.QueryEscape(sq.TrackName)
		artistName := url.QueryEscape(sq.ArtistName)

		reqUrl := fmt.Sprintf(
			"https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=2&q=%s+%s&key=%s",
			trackName, artistName, YOUTUBE_API_KEY,
		)

		resp, err := client.R().SetHeader("Content-Type", "application/json").Get(reqUrl)
		if err != nil {
			log.Println("Error fetching YouTube search results:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
		}

		// Check HTTP status code
		if resp.StatusCode() != 200 {
			log.Println("YouTube API error:", resp.Status(), string(resp.Body()))
			return c.Status(resp.StatusCode()).JSON(fiber.Map{"error": "YouTube API error"})
		}

		// Parse YouTube response
		var result struct {
			Items []struct {
				ID struct {
					VideoID string `json:"videoId"`
				} `json:"id"`
				Snippet struct {
					Title string `json:"title"`
				} `json:"snippet"`
			} `json:"items"`
		}

		if err := json.Unmarshal(resp.Body(), &result); err != nil {
			log.Println("Error parsing YouTube response:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse YouTube response"})
		}

		// Format Response
		formattedYTResponse := make([]fiber.Map, len(result.Items))
		for i, item := range result.Items {
			formattedYTResponse[i] = fiber.Map{
				"YT_VIDEO_ID": item.ID.VideoID,
				"YT_TITLE":    item.Snippet.Title,
			}
		}

		return c.JSON(formattedYTResponse)
	})
	app.Post("/transify", func(c *fiber.Ctx) error {
		type Request struct {
			VideoIDs []string `json:"videoIds"`
		}

		req := new(Request)
		if err := c.BodyParser(req); err != nil {
			log.Println("Error parsing request body:", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse request body"})
		}

		ctx := context.Background()

		for _, videoId := range req.VideoIDs {
			cacheKey := "audio:" + videoId

			// Check if audio already exists in cache
			cachedAudio, err := redisClient.Get(ctx, cacheKey).Bytes()
			if err == nil && len(cachedAudio) > 0 {
				log.Printf("Cache hit: %s (size: %d MBs)\n", videoId, len(cachedAudio)/(1024*1024))
				continue // Skip downloading since it's already cached
			} else {
				log.Printf("Cache miss: %s. Downloading...\n", videoId)
			}

			// Download audio using yt-dlp
			videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoId)
			cmd := exec.Command("yt-dlp", "-f", "bestaudio", "--extract-audio", "--audio-format", "mp3", "-o", "-", videoURL)

			var out bytes.Buffer
			cmd.Stdout = &out

			if err := cmd.Run(); err != nil {
				log.Printf("Failed to download %s: %v\n", videoURL, err)
				continue
			}

			audioBytes := out.Bytes()
			log.Printf("Downloaded audio for %s: %d bytes\n", videoId, len(audioBytes))

			// Store audio in Redis
			err = redisClient.Set(ctx, cacheKey, audioBytes, 6*time.Hour).Err()
			if err != nil {
				log.Println("Error caching audio:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cache audio"})
			}

			log.Println("Cached:", videoURL)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Playlist cached successfully"})
	})

	//Streaming from redis cache
	app.Get("/stream/:videoID", func(c *fiber.Ctx) error {
		videoId := c.Params("videoID")
		ctx := context.Background()

		exists, err := redisClient.Exists(ctx, "audio:"+videoId).Result()
		if err != nil {
			log.Println("Redis error:", err)
			return c.Status(500).JSON(fiber.Map{"error": "Redis error"})
		}

		if exists == 0 {
			log.Println("Audio not found in cache:", videoId)
			return c.Status(404).JSON(fiber.Map{"error": "Audio not found"})
		}

		audioData, err := redisClient.Get(ctx, "audio:"+videoId).Bytes()
		if err == redis.Nil {
			log.Println("Key not found in Redis:", videoId)
			return c.Status(404).JSON(fiber.Map{"error": "Audio not found"})
		} else if err != nil {
			log.Println("Redis fetch error:", err)
			return c.Status(500).JSON(fiber.Map{"error": "Redis fetch error"})
		}

		log.Println("Streaming:", videoId, "Size:", len(audioData)/(1024*1024), "MB")
		c.Set("Content-Type", "audio/mpeg")
		return c.Send(audioData)
	})
	log.Fatal(app.Listen(":8001"))
}
