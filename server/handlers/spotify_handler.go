package handlers

import (
	"Vybe/utils"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)


type spotifyTokenResp struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

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

func GetPlaylistTracksPublic(c *fiber.Ctx) error {
	PID := c.Params("PID")
	clientID := utils.SpotifyClientID()
	clientSecret := utils.SpotifyClientSecret()

	if clientID == "" || clientSecret == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Spotify client credentials not set"})
	}

	//Get App Access Token
	token, err := getSpotifyAppToken(clientID, clientSecret)
	if err != nil {
		log.Println("Failed to get Spotify token:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to authenticate with Spotify"})
	}

	//Fetch playlist tracks
	reqURL := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", PID)
	req, _ := http.NewRequestWithContext(context.Background(), "GET", reqURL, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error fetching playlist tracks:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch playlist tracks"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		log.Printf("Spotify API error: %s", buf.String())
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Spotify API error"})
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

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Println("Error parsing Spotify response:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse playlist tracks"})
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

// Helper function to get Spotify app access token
func getSpotifyAppToken(clientID, clientSecret string) (string, error) {
	data := "grant_type=client_credentials"
	req, _ := http.NewRequest("POST", "https://accounts.spotify.com/api/token", bytes.NewBufferString(data))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var tokenResp spotifyTokenResp
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	return tokenResp.AccessToken, nil
}
