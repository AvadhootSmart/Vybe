package handlers

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"Vybe/utils"

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

	log.Printf("Transify called with %d video IDs: %v", len(req.VideoIDs), req.VideoIDs)
	ctx := context.Background()

	cacheDir := utils.AudioCacheDir()
	if cacheDir == "" {
		cacheDir = "./audio"
	}
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cache directory error"})
	}

	cachedFiles := make(map[string]string)
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, videoId := range req.VideoIDs {
		wg.Add(1)
		go func(videoId string) {
			defer wg.Done()

			finalPath := downloadVideo(ctx, videoId, cacheDir)
			if finalPath != "" {
				mu.Lock()
				cachedFiles[videoId] = finalPath
				mu.Unlock()
			}
		}(videoId)
	}

	wg.Wait()

	log.Printf("Transify completed. Cached %d files: %v", len(cachedFiles), cachedFiles)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"cached": cachedFiles,
	})
}

//handles Redis caching and yt-dlp download
func downloadVideo(ctx context.Context, videoId, cacheDir string) string {
	cacheKey := "audio:" + videoId

	// Step 1: Check Redis
	cachedPath, err := utils.RedisClient.Get(ctx, cacheKey).Result()
	if err == nil && cachedPath != "" {
		if _, statErr := os.Stat(cachedPath); statErr == nil {
			log.Printf("Cache hit: %s at %s", videoId, cachedPath)
			return cachedPath
		}
		log.Printf("Cache miss: file not found on disk for %s at %s", videoId, cachedPath)
	} else {
		log.Printf("Cache miss: no cached path for %s", videoId)
	}

	// Step 2: Download using yt-dlp
	outputPath := filepath.Join(cacheDir, fmt.Sprintf("%s.%%(ext)s", videoId))
	videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoId)

	cmd := exec.Command(utils.YtDlpPath(),
		"--cookies", utils.CookiesPath(),
		"-f", "bestaudio[ext=m4a]", // use original format for speed
		// "--audio-format", "copy",    // skip conversion
		"--no-warnings",
		"--no-progress",
		"--quiet",
		"-o", outputPath,
		videoURL,
	)

	var stderr bytes.Buffer
	cmd.Stdout = nil
	cmd.Stderr = &stderr
	cmd.Stdin = nil

	if err := cmd.Run(); err != nil {
		log.Printf("yt-dlp failed for %s: %v", videoURL, stderr.String())
		return ""
	}

	finalPath := filepath.Join(cacheDir, fmt.Sprintf("%s.m4a", videoId))
	if _, err := os.Stat(finalPath); err != nil {
		log.Printf("Download failed: file not found at %s", finalPath)
		return ""
	}

	// Step 3: Save path in Redis
	if err := utils.RedisClient.Set(ctx, cacheKey, finalPath, 6*time.Hour).Err(); err != nil {
		log.Printf("Redis cache set failed: %v", err)
	} else {
		log.Printf("Cached path in Redis: %s -> %s", cacheKey, finalPath)
	}

	log.Printf("Downloaded %s → %s", videoId, finalPath)
	return finalPath
}
