package handlers

import (
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
)

// GetUserData returns the authenticated user's profile from a JWT
func GetUserData(c *fiber.Ctx) error {
	// 1️⃣ Extract the Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
	}

	var tokenString string
	fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
	}

	// 2️⃣ Parse and validate the JWT
	claims := jwt.MapClaims{}
	secret := []byte(os.Getenv("JWT_SECRET"))

	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		// Ensure token uses HMAC signing method
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	// 3️⃣ Extract user data safely
	user := map[string]string{
		"id":      fmt.Sprintf("%v", claims["id"]),
		"email":   fmt.Sprintf("%v", claims["email"]),
		"name":    fmt.Sprintf("%v", claims["name"]),
		"picture": fmt.Sprintf("%v", claims["picture"]),
	}

	// 4️⃣ Return JSON response
	return c.JSON(fiber.Map{"user": user})
}
