package services


import (
    "fmt"
    "os"

    "github.com/golang-jwt/jwt/v5"
)

type User struct {
    ID      string
    Email   string
    Name    string
    Picture string
}

func ParseJWT(tokenString string) (*User, error) {
    claims := jwt.MapClaims{}
    secret := []byte(os.Getenv("JWT_SECRET"))

    token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
        }
        return secret, nil
    })

    if err != nil || !token.Valid {
        return nil, fmt.Errorf("invalid or expired token: %w", err)
    }

    user := &User{
        ID:      fmt.Sprintf("%v", claims["id"]),
        Email:   fmt.Sprintf("%v", claims["email"]),
        Name:    fmt.Sprintf("%v", claims["name"]),
        Picture: fmt.Sprintf("%v", claims["picture"]),
    }

    return user, nil
}
