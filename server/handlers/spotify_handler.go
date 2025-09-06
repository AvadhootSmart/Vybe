package handlers

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)


var client = resty.New()

func GetAllPlaylists(c *fiber.Ctx) error {
	// Extract Authorization header
	authHeader := c.Get("Authorization")
	// log.Println(authHeader)
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No access token provided"})
	}

	// Make request to Spotify API
	response, err := client.R().
		SetHeader("Authorization", authHeader).
		Get("https://api.spotify.com/v1/me/playlists")

	if err != nil {
		log.Fatalf("Error fetching playlists:%s", err)
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

	if err := json.Unmarshal(response.Body(), &result); err != nil {
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
}

func GetPlaylistTracks(c *fiber.Ctx) error {
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
		log.Fatalf("Error fetching playlist's tracks:%s", err)
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

	if len(formattedTracks) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No tracks found"})
	}

	return c.JSON(formattedTracks)
}
