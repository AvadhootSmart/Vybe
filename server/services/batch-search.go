package services

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

type VideoInfo struct {
	ID      string
	Title   string
	Channel string
}

func BatchSearch(queries []string) ([]VideoInfo, error) {
	prefixed := make([]string, len(queries))
	for i, q := range queries {
		prefixed[i] = fmt.Sprintf("ytsearch1:%s", q)
	}

	cmd := exec.Command("yt-dlp", "--print", "%(id)s\t%(title)s\t%(channel)s", "--no-warnings", "--quiet", "-a", "-")

	var stdin bytes.Buffer
	stdin.WriteString(strings.Join(prefixed, "\n"))
	cmd.Stdin = &stdin

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp error: %v\n%s", err, stderr.String())
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	results := make([]VideoInfo, 0, len(lines))

	for _, line := range lines {
		parts := strings.SplitN(line, "\t", 3)
		if len(parts) == 3 {
			results = append(results, VideoInfo{
				ID:      parts[0],
				Title:   parts[1],
				Channel: parts[2],
			})
		}
	}

	return results, nil
}

func Search(query string) ([]VideoInfo, error) {

	search := fmt.Sprintf("ytsearch1:%s", query)
	cmd := exec.Command("yt-dlp", "--print", "%(id)s\t%(title)s\t%(channel)s", "--no-warnings", "--quiet", search)

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp error: %v\n%s", err, stderr.String())
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	results := make([]VideoInfo, 0, len(lines))

	for _, line := range lines {
		parts := strings.SplitN(line, "\t", 3)
		if len(parts) == 3 {
			results = append(results, VideoInfo{
				ID:      parts[0],
				Title:   parts[1],
				Channel: parts[2],
			})
		}
	}

	return results, nil
}
