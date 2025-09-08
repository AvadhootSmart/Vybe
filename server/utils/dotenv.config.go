package utils

import "os"

// func Port() string          { return os.Getenv("PORT") }
// func ProdURL() string       { return os.Getenv("PROD_URL") }
func AudioCacheDir() string { return os.Getenv("AUDIO_CACHE_DIR") }
func CookiesPath() string   { return os.Getenv("COOKIES_PATH") }
func YtDlpPath() string     { return os.Getenv("YT_DLP_PATH") }
