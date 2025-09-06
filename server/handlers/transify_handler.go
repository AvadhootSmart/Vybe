package handlers

import (
	"Vybe/utils"
	"bytes"
	"context"
	"fmt"
	"log"
	"os/exec"
	"time"

	"github.com/gofiber/fiber/v2"
)


func Transify(c *fiber.Ctx) error {
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
			cachedAudio, err := utils.RedisClient.Get(ctx, cacheKey).Bytes()
			if err == nil && len(cachedAudio) > 0 {
				log.Printf("Cache hit: %s (size: %d MBs)\n", videoId, len(cachedAudio)/(1024*1024))
				continue // Skip downloading since it's already cached
			} else {
				log.Printf("Cache miss: %s. Downloading...\n", videoId)
			}

			// Download audio using yt-dlp
			videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoId)
			// cmd := exec.Command("yt-dlp", "-f", "bestaudio", "--extract-audio", "--audio-format", "mp3", "-o", "-", videoURL)
			// cmd := exec.Command("/home/ubuntu/.local/bin/yt-dlp", "--cookies", "./tester-cookies.txt", "-f", "bestaudio", "--extract-audio", "--audio-format", "mp3", "-o", "-", videoURL)

			cmd := exec.Command("yt-dlp", "--cookies", "./cookies.txt", "-f", "bestaudio", "--extract-audio", "--geo-bypass", "--audio-format", "mp3", "-o", "-", videoURL)
			var out, stderr bytes.Buffer
			cmd.Stdout = &out
			cmd.Stderr = &stderr

			if err := cmd.Run(); err != nil {
				log.Printf("Failed to download %s: %v\n", videoURL, err)
				log.Printf("Error output: %s\n", stderr.String())
				continue
			}

			audioBytes := out.Bytes()
			log.Printf("Downloaded audio for %s: %d bytes\n", videoId, len(audioBytes))

			// Store audio in Redis
			err = utils.RedisClient.Set(ctx, cacheKey, audioBytes, 6*time.Hour).Err()
			if err != nil {
				log.Println("Error caching audio:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cache audio"})
			}

			log.Println("Cached:", videoURL)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Playlist cached successfully"})
}
