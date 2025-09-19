package services

import (
	// "Vybe/utils"
	"Vybe/utils"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	// "strings"
)

var ytDlpLimit = make(chan struct{}, 2)

func acquireSlot() {
	ytDlpLimit <- struct{}{}
}

func releaseSlot() {
	<-ytDlpLimit
}

type YTSong struct {
	Title string `json:"title"`
	Artist []string `json:"artists"`
	ID string `json:"videoId"`
	Duration string `json:"duration"`
	Image string `json:"image"`
}

type VideoInfo struct {
	ID      string
	Title   string
	Channel string
}

// func BatchSearch(queries []string) ([]VideoInfo, error) {
// 	prefixed := make([]string, len(queries))
// 	for i, q := range queries {
// 		prefixed[i] = fmt.Sprintf("ytsearch1:%s", q)
// 	}

// 	ytDlpPath := utils.YtDlpPath()
// 	log.Println("PATH:", ytDlpPath)
// 	if ytDlpPath == "" {
// 		ytDlpPath = "yt-dlp"
// 	}

// 	cookiesPath := utils.CookiesPath()
// 	if cookiesPath == "" {
// 		cookiesPath = "../cookies.txt"
// 	}


// 	cmd := exec.Command(ytDlpPath, "--cookies", cookiesPath, "--print", "%(id)s\t%(title)s\t%(channel)s", "--no-warnings", "--quiet", "-a", "-")

// 	var stdin bytes.Buffer
// 	stdin.WriteString(strings.Join(prefixed, "\n"))
// 	cmd.Stdin = &stdin

// 	var out, stderr bytes.Buffer
// 	cmd.Stdout = &out
// 	cmd.Stderr = &stderr

// 	acquireSlot()
// 	defer releaseSlot()

// 	err := cmd.Run()
// 	if err != nil {
// 		return nil, fmt.Errorf("yt-dlp error: %v\n%s", err, stderr.String())
// 	}

// 	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
// 	results := make([]VideoInfo, 0, len(lines))

// 	for _, line := range lines {
// 		parts := strings.SplitN(line, "\t", 3)
// 		if len(parts) == 3 {
// 			results = append(results, VideoInfo{
// 				ID:      parts[0],
// 				Title:   parts[1],
// 				Channel: parts[2],
// 			})
// 		}
// 	}

// 	return results, nil
// }

// func Search(query string) ([]VideoInfo, error) {

// 	ytDlpPath := utils.YtDlpPath()
// 	if ytDlpPath == "" {
// 		ytDlpPath = "yt-dlp"
// 	}

// 	cookiesPath := utils.CookiesPath()
// 	if cookiesPath == "" {
// 		cookiesPath = "../cookies.txt"
// 	}

// 	search := fmt.Sprintf("ytsearch1:%s", query)
// 	cmd := exec.Command(ytDlpPath, "--cookies", cookiesPath, "--print", "%(id)s\t%(title)s\t%(channel)s", "--no-warnings", "--quiet", search)

// 	var out, stderr bytes.Buffer
// 	cmd.Stdout = &out
// 	cmd.Stderr = &stderr

// 	acquireSlot()
// 	defer releaseSlot()

// 	err := cmd.Run()
// 	if err != nil {
// 		return nil, fmt.Errorf("yt-dlp error: %v\n%s", err, stderr.String())
// 	}

// 	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
// 	results := make([]VideoInfo, 0, len(lines))

// 	for _, line := range lines {
// 		parts := strings.SplitN(line, "\t", 3)
// 		if len(parts) == 3 {
// 			results = append(results, VideoInfo{
// 				ID:      parts[0],
// 				Title:   parts[1],
// 				Channel: parts[2],
// 			})
// 		}
// 	}

// 	return results, nil
// }
func Search(query string) ([]YTSong, error) {
	ytMusicPath := utils.YtMusicPath()
	if ytMusicPath == "" {
		ytMusicPath = "/home/avadhoot/Projects/Vybe/server/yt-music-api/main.py"
	}

	log.Println("PATH:", ytMusicPath)

	pythonPath := utils.PythonPath()
	if pythonPath == "" {
		pythonPath = "/home/avadhoot/Projects/Vybe/server/yt-music-api/venv/bin/python3"
	}

	cmd := exec.Command(pythonPath,ytMusicPath, "--search", query)

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("yt-music-api error: %v\nstderr: %s", err, stderr.String())
	}

	var results []YTSong
	if err := json.Unmarshal(out.Bytes(), &results); err != nil {
		return nil, fmt.Errorf("error parsing yt-music-api output: %v\nraw output: %s", err, out.String())
	}

	return results, nil
}
