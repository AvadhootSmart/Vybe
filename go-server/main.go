package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

//Super crappy code, I know, cleaning chores will be done on initial release
func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	YOUTUBE_API_KEY := os.Getenv("YOUTUBE_API_KEY")

	app := fiber.New()
	client := resty.New()

	app.Use(logger.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Get("/spotify/playlists", func(c *fiber.Ctx) error {
		// Extract Authorization header
		authHeader := c.Get("Authorization")
		log.Println(authHeader)
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
			log.Fatalf("Error parsing request body:", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to parse request body"})
		}

		trackName := url.QueryEscape(sq.TrackName)
		artistName := url.QueryEscape(sq.ArtistName)

		reqUrl := fmt.Sprintf("https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=%s-%s&key=%s", trackName, artistName, YOUTUBE_API_KEY)

		resp, err := client.R().SetHeader("Content-Type", "application/json").Get(reqUrl)
		if err != nil {
			log.Fatalf("Error fetching YT search results:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch playlist's tracks"})
		}

		var result struct {
			Items []struct {
				ID struct {
					VideoId string `json:"videoId"`
				} `json:"id"`
				Snippet struct {
					Title string `json:"title"`
				} `json:"snippet"`
			} `json:"items"`
		}

		if err := json.Unmarshal(resp.Body(), &result); err != nil {
			log.Println("Error parsing response:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse playlist's tracks"})
		}

		formattedYTResponse := make([]fiber.Map, len(result.Items))
		for i, item := range result.Items {
			formattedYTResponse[i] = fiber.Map{
				"YT_VIDEO_ID": item.ID.VideoId,
				"YT_TITLE":    item.Snippet.Title,
			}
		}

		return c.JSON(formattedYTResponse)
	})

	log.Fatal(app.Listen(":8001"))
}
