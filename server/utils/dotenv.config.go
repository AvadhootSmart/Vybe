package utils

import (
	"os"
)

var PORT string = os.Getenv("PORT")
var PROD_URL string = os.Getenv("PROD_URL")
var AUDIO_CACHE_DIR string = os.Getenv("AUDIO_CACHE_DIR")
var COOKIES_PATH string = os.Getenv("COOKIES_PATH")
var YT_DLP_PATH string = os.Getenv("YT_DLP_PATH")

