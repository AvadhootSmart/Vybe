package handlers

import (
	"Vybe/utils"
	"context"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func SteamAudio(c *fiber.Ctx) error {
	videoId := c.Params("videoID")
	ctx := context.Background()

	exists, err := utils.RedisClient.Exists(ctx, "audio:"+videoId).Result()
	if err != nil {
		log.Println("Redis error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Redis error"})
	}

	if exists == 0 {
		log.Println("Audio not found in cache:", videoId)
		return c.Status(404).JSON(fiber.Map{"error": "Audio not found"})
	}

	audioData, err := utils.RedisClient.Get(ctx, "audio:"+videoId).Bytes()
	if err == redis.Nil {
		return c.Status(404).JSON(fiber.Map{"error": "Audio not found"})
	} else if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Redis fetch error"})
	}

	fileSize := int64(len(audioData))
	rangeHeader := c.Get("Range")

	if rangeHeader == "" {
		// No range requested → send full file
		c.Set("Content-Type", "audio/mpeg")
		c.Set("Content-Length", fmt.Sprintf("%d", fileSize))
		c.Set("Accept-Ranges", "bytes")
		return c.Send(audioData)
	}

	// Parse Range header (e.g. "bytes=0-")
	var start, end int64
	_, err = fmt.Sscanf(rangeHeader, "bytes=%d-%d", &start, &end)
	if err != nil || start < 0 {
		start = 0
	}
	if end == 0 || end >= fileSize {
		end = fileSize - 1
	}

	if start > end || start >= fileSize {
		return c.Status(416).SendString("Requested Range Not Satisfiable")
	}

	chunk := audioData[start : end+1]

	c.Status(fiber.StatusPartialContent) // 206
	c.Set("Content-Type", "audio/mpeg")
	c.Set("Accept-Ranges", "bytes")
	c.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
	c.Set("Content-Length", fmt.Sprintf("%d", len(chunk)))

	return c.Send(chunk)
}
