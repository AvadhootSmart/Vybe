// package handlers

// import (
// 	"Vybe/utils"
// 	"context"
// 	"fmt"
// 	"log"
// 	"os"
// 	"strconv"
// 	"strings"

// 	"github.com/gofiber/fiber/v2"
// )

// func StreamAudio(c *fiber.Ctx) error {
// 	videoId := c.Params("videoID")
// 	ctx := context.Background()

// 	// 1. Get cached file path from Redis
// 	filePath, err := utils.RedisClient.Get(ctx, "audio:"+videoId).Result()
// 	if err != nil {
// 		log.Println("Redis error:", err)
// 		return c.Status(404).JSON(fiber.Map{"error": "Audio not found"})
// 	}

// 	// 2. Check file exists on disk
// 	file, err := os.Open(filePath)
// 	if err != nil {
// 		log.Printf("File not found on disk: %s\n", filePath)
// 		return c.Status(404).JSON(fiber.Map{"error": "Audio file missing"})
// 	}
// 	defer file.Close()

// 	// 3. Get file size
// 	stat, err := file.Stat()
// 	if err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": "Failed to stat file"})
// 	}
// 	fileSize := stat.Size()

// 	rangeHeader := c.Get("Range")
// 	if rangeHeader == "" {
// 		// No range → send full file
// 		c.Set("Content-Type", "audio/mpeg")
// 		c.Set("Content-Length", strconv.FormatInt(fileSize, 10))
// 		c.Set("Accept-Ranges", "bytes")
// 		return c.SendFile(filePath, true)
// 	}

// 	// 4. Parse Range header (e.g. "bytes=0-")
// 	var start, end int64
// 	start, end = 0, fileSize-1

// 	if strings.HasPrefix(rangeHeader, "bytes=") {
// 		parts := strings.Split(strings.TrimPrefix(rangeHeader, "bytes="), "-")
// 		if len(parts) == 2 {
// 			if parts[0] != "" {
// 				if s, err := strconv.ParseInt(parts[0], 10, 64); err == nil {
// 					start = s
// 				}
// 			}
// 			if parts[1] != "" {
// 				if e, err := strconv.ParseInt(parts[1], 10, 64); err == nil {
// 					end = e
// 				}
// 			}
// 		}
// 	}

// 	if start > end || start >= fileSize {
// 		return c.Status(416).SendString("Requested Range Not Satisfiable")
// 	}

// 	chunkSize := end - start + 1
// 	buffer := make([]byte, chunkSize)

// 	_, err = file.ReadAt(buffer, start)
// 	if err != nil {
// 		log.Println("File read error:", err)
// 		return c.Status(500).JSON(fiber.Map{"error": "File read error"})
// 	}

// 	// 5. Set headers for partial content
// 	c.Status(fiber.StatusPartialContent)
// 	c.Set("Content-Type", "audio/mpeg")
// 	c.Set("Accept-Ranges", "bytes")
// 	c.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
// 	c.Set("Content-Length", strconv.FormatInt(chunkSize, 10))

// 	return c.Send(buffer)
// }

//v2 ---- Without Redis Caching

package handlers

import (
	"Vybe/utils"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func StreamAudio(c *fiber.Ctx) error {
	videoId := c.Params("videoID")

	cacheDir := utils.AudioCacheDir()
	if cacheDir == "" {
		cacheDir = "./audio"
	}

	// 1. Construct local file path
	filePath := filepath.Join(cacheDir, fmt.Sprintf("%s.m4a", videoId))

	// 2. Check if file exists
	file, err := os.Open(filePath)
	if err != nil {
		log.Printf("File not found: %s\n", filePath)
		return c.Status(404).JSON(fiber.Map{"error": "Audio file not found"})
	}
	defer file.Close()

	// 3. Get file size
	stat, err := file.Stat()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to stat file"})
	}
	fileSize := stat.Size()

	rangeHeader := c.Get("Range")
	if rangeHeader == "" {
		// No range → send full file
		c.Set("Content-Type", "audio/mpeg")
		c.Set("Content-Length", strconv.FormatInt(fileSize, 10))
		c.Set("Accept-Ranges", "bytes")
		return c.SendFile(filePath, true)
	}

	// 4. Parse Range header (e.g. "bytes=0-")
	var start, end int64
	start, end = 0, fileSize-1

	if strings.HasPrefix(rangeHeader, "bytes=") {
		parts := strings.Split(strings.TrimPrefix(rangeHeader, "bytes="), "-")
		if len(parts) == 2 {
			if parts[0] != "" {
				if s, err := strconv.ParseInt(parts[0], 10, 64); err == nil {
					start = s
				}
			}
			if parts[1] != "" {
				if e, err := strconv.ParseInt(parts[1], 10, 64); err == nil {
					end = e
				}
			}
		}
	}

	if start > end || start >= fileSize {
		return c.Status(416).SendString("Requested Range Not Satisfiable")
	}

	chunkSize := end - start + 1
	buffer := make([]byte, chunkSize)

	_, err = file.ReadAt(buffer, start)
	if err != nil {
		log.Println("File read error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "File read error"})
	}

	// 5. Set headers for partial content
	c.Status(fiber.StatusPartialContent)
	c.Set("Content-Type", "audio/mpeg")
	c.Set("Accept-Ranges", "bytes")
	c.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
	c.Set("Content-Length", strconv.FormatInt(chunkSize, 10))

	return c.Send(buffer)
}
