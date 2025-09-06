package handlers

import (
	"Vybe/services"
	"log"
	"net/url"

	"github.com/gofiber/fiber/v2"
)

func SingleSearch(c  *fiber.Ctx) error {
	type Request struct {
		Query string `json:"query"`
	}

	rq := new(Request)
	if err := c.BodyParser(rq); err != nil {
		log.Println("Error parsing request body:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	query := url.QueryEscape(rq.Query)

	response, err := services.Search(query)
	if err != nil {
		log.Println("Error fetching YouTube search results:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
	}

	log.Printf("Response %s", response)

	// Format Response
	formattedYTResponse := make([]fiber.Map, len(response))
	for i, item := range response {
		formattedYTResponse[i] = fiber.Map{
			"YT_VIDEO_ID": item.ID,
			"YT_TITLE":    item.Title,
		}
	}

	return c.JSON(formattedYTResponse)
	// return c.JSON(response)
}

func PlaylistTracksSearch(c *fiber.Ctx) error {
	type SearchRequest struct {
		Tracks []string `json:"tracks"`
	}

	sq := new(SearchRequest)
	if err := c.BodyParser(sq); err != nil {
		log.Println("Error parsing request body:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	response, err := services.BatchSearch(sq.Tracks)
	if err != nil {
		log.Println("Error fetching YouTube search results:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
	}

	// Format Response
	formattedYTResponse := make([]fiber.Map, len(response))
	for i, item := range response {
		formattedYTResponse[i] = fiber.Map{
			"YT_VIDEO_ID": item.ID,
			"YT_TITLE":    item.Title,
		}
	}
	return c.JSON(fiber.Map{"data": formattedYTResponse})
}
