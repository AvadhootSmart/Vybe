package handlers

import (
	"Vybe/services"
	"Vybe/utils"
	"encoding/json"
	"fmt"
	"log"
	"net/url"

	"github.com/gofiber/fiber/v2"
)

// func SingleSearch(c *fiber.Ctx) error {
// 	type Request struct {
// 		Query string `json:"query"`
// 	}

// 	rq := new(Request)
// 	if err := c.BodyParser(rq); err != nil {
// 		log.Println("Error parsing request body:", err)
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
// 	}

// 	query := url.QueryEscape(rq.Query)

// 	response, err := services.Search(query)
// 	if err != nil {
// 		log.Println("Error fetching YouTube search results:", err)
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
// 	}

// 	log.Printf("Response count: %d", len(response))

// 	// Format Response
// 	formattedYTResponse := make([]fiber.Map, len(response))
// 	for i, item := range response {
// 		formattedYTResponse[i] = fiber.Map{
// 			"YT_VIDEO_ID": item.ID,
// 			"YT_TITLE":    item.Title,
// 		}
// 	}

// 	return c.JSON(formattedYTResponse)
// 	// return c.JSON(response)
// }

// func PlaylistTracksSearch(c *fiber.Ctx) error {
// 	type SearchRequest struct {
// 		Tracks []string `json:"tracks"`
// 	}

// 	sq := new(SearchRequest)
// 	if err := c.BodyParser(sq); err != nil {
// 		log.Println("Error parsing request body:", err)
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
// 	}

// 	response, err := services.BatchSearch(sq.Tracks)
// 	if err != nil {
// 		log.Println("Error fetching YouTube search results:", err)
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
// 	}

// 	// Format Response
// 	formattedYTResponse := make([]fiber.Map, len(response))
// 	for i, item := range response {
// 		formattedYTResponse[i] = fiber.Map{
// 			"YT_VIDEO_ID": item.ID,
// 			"YT_TITLE":    item.Title,
// 		}
// 	}
// 	return c.JSON(fiber.Map{"data": formattedYTResponse})
// }

func ApiSearch(c *fiber.Ctx) error {
	type SearchRequest struct {
		TrackName  string `json:"trackName"`
		ArtistName string `json:"artistName"`
	}

	sq := new(SearchRequest)
	if err := c.BodyParser(sq); err != nil {
		log.Println("Error parsing request body:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	trackName := url.QueryEscape(sq.TrackName)
	artistName := url.QueryEscape(sq.ArtistName)

	reqUrl := fmt.Sprintf(
		"https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=2&q=%s+%s&key=%s",
		trackName, artistName, utils.YtApiKey(),
		)

	resp, err := client.R().SetHeader("Content-Type", "application/json").Get(reqUrl)
	if err != nil {
		log.Println("Error fetching YouTube search results:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
	}

	// Check HTTP status code
	if resp.StatusCode() != 200 {
		log.Println("YouTube API error:", resp.Status(), string(resp.Body()))
		return c.Status(resp.StatusCode()).JSON(fiber.Map{"error": "YouTube API error"})
	}

	// Parse YouTube response
	var result struct {
		Items []struct {
			ID struct {
				VideoID string `json:"videoId"`
			} `json:"id"`
			Snippet struct {
				Title string `json:"title"`
			} `json:"snippet"`
		} `json:"items"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		log.Println("Error parsing YouTube response:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse YouTube response"})
	}

	// Format Response
	formattedYTResponse := make([]fiber.Map, len(result.Items))
	for i, item := range result.Items {
		formattedYTResponse[i] = fiber.Map{
			"YT_VIDEO_ID": item.ID.VideoID,
			"YT_TITLE":    item.Snippet.Title,
		}
	}

	return c.JSON(formattedYTResponse)
}

func BasicApiSearch(c *fiber.Ctx) error {
	type SearchRequest struct {
		Query string `json:"query"`
	}

	sq := new(SearchRequest)
	if err := c.BodyParser(sq); err != nil {
		log.Println("Error parsing request body:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	query := url.QueryEscape(sq.Query)

	reqUrl := fmt.Sprintf(
		"https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=%s&key=%s",
		query, utils.YtApiKey(),
		)

	resp, err := client.R().SetHeader("Content-Type", "application/json").Get(reqUrl)
	if err != nil {
		log.Println("Error fetching YouTube search results:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch YouTube data"})
	}

	// Check HTTP status code
	if resp.StatusCode() != 200 {
		log.Println("YouTube API error:", resp.Status(), string(resp.Body()))
		return c.Status(resp.StatusCode()).JSON(fiber.Map{"error": "YouTube API error"})
	}

	// Parse YouTube response
	var result struct {
		Items []struct {
			ID struct {
				VideoID string `json:"videoId"`
			} `json:"id"`
			Snippet struct {
				Title string `json:"title"`
			} `json:"snippet"`
		} `json:"items"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		log.Println("Error parsing YouTube response:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse YouTube response"})
	}

	// Format Response
	formattedYTResponse := make([]fiber.Map, len(result.Items))
	for i, item := range result.Items {
		formattedYTResponse[i] = fiber.Map{
			"YT_VIDEO_ID": item.ID.VideoID,
			"YT_TITLE":    item.Snippet.Title,
		}
	}

	return c.JSON(formattedYTResponse)
}

func SingleSearch(c *fiber.Ctx) error {
    type Request struct {
        Query string `json:"query"`
    }

    rq := new(Request)
    if err := c.BodyParser(rq); err != nil {
        log.Println("Error parsing request body:", err)
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request format",
        })
    }

    response, err := services.Search(rq.Query)
    if err != nil {
        log.Println("Error fetching YouTube search results:", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(), // bubble up Python stderr or JSON parse error
        })
    }

    log.Printf("Response count: %d", len(response))
    return c.JSON(response)
}
