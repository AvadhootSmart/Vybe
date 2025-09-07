package services

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Conn   *websocket.Conn
	Room   string
	IsHost bool
}

type Event struct {
	Type string `json:"type"`
	SongID string `json:"songID,omitempty"`
}

type Room struct {
	clients        map[*Client]bool
	songsQueue     []string
	currentSongIdx int
}

type Hub struct {
	rooms map[string]*Room
	mux   sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
	}
}

func (h *Hub) JoinRoom(roomID string, c *Client) {
	h.mux.Lock()
	defer h.mux.Unlock()

	room, ok := h.rooms[roomID]
	if !ok {
		room = &Room{
			clients:        make(map[*Client]bool),
			songsQueue:     []string{},
			currentSongIdx: -1,
		}
		h.rooms[roomID] = room
	}

	room.clients[c] = true
}

func (h *Hub) LeaveRoom(roomID string, c *Client) {
	h.mux.Lock()
	defer h.mux.Unlock()

	if room, ok := h.rooms[roomID]; ok {
		delete(room.clients, c)
		if len(room.clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *Hub) Broadcast(roomID string, event Event) {
	h.mux.RLock()
	room, ok := h.rooms[roomID]
	if !ok {
		h.mux.RUnlock()
		return
	}

	data, _ := json.Marshal(event)
	failedClients := []*Client{}

	for client := range room.clients {
		if err := client.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Println("Broadcast error:", err)
			failedClients = append(failedClients, client)
		}
	}
	h.mux.RUnlock()

	if len(failedClients) > 0 {
		h.mux.Lock()
		for _, client := range failedClients {
			client.Conn.Close()
			delete(room.clients, client)
		}
		h.mux.Unlock()
	}
}

// ---- Queue Management ----

func (h *Hub) AddSong(roomID, songID string) {
	h.mux.Lock()
	defer h.mux.Unlock()

	if room, ok := h.rooms[roomID]; ok {
		room.songsQueue = append(room.songsQueue, songID)
		if room.currentSongIdx == -1 {
			room.currentSongIdx = 0
		}
	}
}

// Move to next song
func (h *Hub) NextSong(roomID string) (string, bool) {
	h.mux.Lock()
	defer h.mux.Unlock()

	room, ok := h.rooms[roomID]
	if !ok || len(room.songsQueue) == 0 {
		return "", false
	}

	if room.currentSongIdx < len(room.songsQueue)-1 {
		room.currentSongIdx++
	} else {
		return "", false // end of queue
	}

	return room.songsQueue[room.currentSongIdx], true
}

// Move to previous song
func (h *Hub) PreviousSong(roomID string) (string, bool) {
	h.mux.Lock()
	defer h.mux.Unlock()

	room, ok := h.rooms[roomID]
	if !ok || len(room.songsQueue) == 0 {
		return "", false
	}

	if room.currentSongIdx > 0 {
		room.currentSongIdx--
	} else {
		return "", false // already at start
	}

	return room.songsQueue[room.currentSongIdx], true
}

// Get current song
func (h *Hub) CurrentSong(roomID string) (string, bool) {
	h.mux.RLock()
	defer h.mux.RUnlock()

	room, ok := h.rooms[roomID]
	if !ok || room.currentSongIdx < 0 || room.currentSongIdx >= len(room.songsQueue) {
		return "", false
	}

	return room.songsQueue[room.currentSongIdx], true
}
