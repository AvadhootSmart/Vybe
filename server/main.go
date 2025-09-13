package main

import (
	"Vybe/handlers"
	"Vybe/services"
	"Vybe/utils"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	app := fiber.New()
	app.Use(logger.New())

	hub := services.NewHub()

	var PORT string = os.Getenv("PORT")

	var CLIENT_URL string = os.Getenv("PROD_URL")
	app.Use(cors.New(cors.Config{
		AllowOrigins:     CLIENT_URL,
		AllowMethods:     "GET,POST,PUT,DELETE,HEAD",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server Running 🚀")
	})

	app.Get("/ws/:roomID/:role", websocket.New(func(c *websocket.Conn) {
		roomID := c.Params("roomID")
		role := c.Params("role")

		client := &services.Client{
			Conn:   c,
			Room:   roomID,
			IsHost: role == "host",
			User:   nil,
		}

		hub.JoinRoom(roomID, client)
		defer func() {
			// Notify other users that someone left before removing from room
			if client.User != nil {
				hub.NotifyUserLeave(roomID, client.User)
			}
			hub.LeaveRoom(roomID, client)
		}()
		log.Printf("User %s joined room %s", client.Conn.RemoteAddr(), roomID)

		authenticated := false
		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Printf("Error reading message: %v", err)
				break
			}

			var event services.Event
			if err := json.Unmarshal(msg, &event); err != nil {
				log.Printf("Invalid event payload: %v", err)
				continue
			}

			if !authenticated {
				if event.Type == "auth" && event.Token != "" {
					user, err := services.ParseJWT(event.Token)
					if err != nil {
						log.Printf("Auth failed : %v", err)
						c.WriteMessage(websocket.TextMessage, []byte("unauthorized"))
						c.Close()
						return
					}

					client.User = user
					log.Printf("User %s authenticated", user.Name)

					c.WriteJSON(fiber.Map{
						"type":   "auth_success",
						"user":   user,
						"isHost": client.IsHost,
					})

					// Notify other users that someone joined
					hub.NotifyUserJoin(roomID, user)
					// Send current user list to the newly joined user
					hub.BroadcastUsers(roomID)
					authenticated = true
					continue
				} else {
					log.Printf("Unauthenticated message: %v", event)
					continue
				}
			}

			switch event.Type {
			case "addToQueue":
				// only host can modify queue
				if client.IsHost && event.Song.VideoID != "" {
					hub.AddSong(roomID, event.Song) //TODO: add complete song struct instead of just id
					hub.Broadcast(roomID, event)
				}

			case "next":
				if client.IsHost {
					if nextSong, ok := hub.NextSong(roomID); ok {
						hub.Broadcast(roomID, services.Event{
							Type: "next",
							Song: nextSong,
						})
					}
				}

			case "previous":
				if client.IsHost {
					if prevSong, ok := hub.PreviousSong(roomID); ok {
						hub.Broadcast(roomID, services.Event{
							Type: "previous",
							Song: prevSong,
						})
					}
				}

			case "play":
				if client.IsHost {
					hub.Broadcast(roomID, event)
				}
			case "pause":
				if client.IsHost {
					hub.Broadcast(roomID, event)
				}

			default:
				// optional: allow listeners to send other events like "ready", "chat", etc.
				log.Printf("Unknown or unauthorized event: %+v", event)
			}
		}
	}))

	app.Get("/me", handlers.GetUserData)
	app.Get("/spotify/playlists", handlers.GetAllPlaylists)
	app.Get("/spotify/playlist/:PID", handlers.GetPlaylistTracks)
	app.Post("/search", handlers.SingleSearch)
	app.Post("/playlist/tracks/search", handlers.PlaylistTracksSearch)
	app.Post("/transify", handlers.Transify)
	app.Get("/stream/:videoID", handlers.StreamAudio)

	// Run the server in a goroutine so we can catch shutdown signals
	go func() {
		if err := app.Listen(fmt.Sprintf(":%s", PORT)); err != nil {
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
