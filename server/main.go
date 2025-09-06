package main

import (
	"Vybe/handlers"
	"Vybe/utils"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

const audioDir = "./songs"

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	app := fiber.New()
	app.Use(logger.New())

	var CLIENT_URL string = os.Getenv("CLIENT_URL")
	app.Use(cors.New(cors.Config{
		AllowOrigins:     CLIENT_URL,
		AllowMethods:     "GET,POST,PUT,DELETE,HEAD",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server Running 🚀")
	})

	app.Get("/spotify/playlists", handlers.GetAllPlaylists)
	app.Get("/spotify/playlist/:PID", handlers.GetPlaylistTracks)
	app.Post("/search", handlers.SingleSearch)
	app.Post("/playlist/tracks/search", handlers.PlaylistTracksSearch)
	app.Post("/transify", handlers.Transify)
	app.Get("/stream/:videoID", handlers.SteamAudio)

	// Run the server in a goroutine so we can catch shutdown signals
	go func() {
		if err := app.Listen(":8001"); err != nil {
			log.Printf("Server stopped: %v", err)
		}
	}()

	// Graceful shutdown handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit // wait here until Ctrl+C or container stop

	log.Println("Shutting down server...")

	// Close Redis client
	if err := utils.RedisClient.Close(); err != nil {
		log.Printf("Error closing Redis: %v", err)
	}

	if err := app.Shutdown(); err != nil {
		log.Printf("Error shutting down Fiber: %v", err)
	}

	log.Println("Server exited cleanly ✅")
}
