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
	User   *User
}

type Song struct {
	Title   string
	VideoID string
}

type Event struct {
	Type  string  `json:"type"`
	Song  Song    `json:"song,omitempty"`
	Token string  `json:"token,omitempty"`
	Users []*User `json:"users,omitempty"`
	User  *User   `json:"user,omitempty"`
}

type Room struct {
	clients        map[*Client]bool
	songsQueue     []Song
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
			songsQueue:     []Song{},
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

func (h *Hub) AddSong(roomID string, song Song) {
	h.mux.Lock()
	defer h.mux.Unlock()

	if room, ok := h.rooms[roomID]; ok {
		room.songsQueue = append(room.songsQueue, song)
		if room.currentSongIdx == -1 {
			room.currentSongIdx = 0
		}
	}
}

// Move to next song
func (h *Hub) NextSong(roomID string) (nextSong Song, status bool) {
	h.mux.Lock()
	defer h.mux.Unlock()

	room, ok := h.rooms[roomID]
	if !ok || len(room.songsQueue) == 0 {
		return Song{}, false
	}

	if room.currentSongIdx < len(room.songsQueue)-1 {
		room.currentSongIdx++
	} else {
		return Song{}, false // end of queue
	}

	nextSong = room.songsQueue[room.currentSongIdx]
	return nextSong, true

	// return room.songsQueue[room.currentSongIdx], true
}

// Move to previous song
func (h *Hub) PreviousSong(roomID string) (prevSong Song, status bool) {
	h.mux.Lock()
	defer h.mux.Unlock()

	room, ok := h.rooms[roomID]
	if !ok || len(room.songsQueue) == 0 {
		return Song{}, false
	}

	if room.currentSongIdx > 0 {
		room.currentSongIdx--
	} else {
		return Song{}, false // already at start
	}

	prevSong = room.songsQueue[room.currentSongIdx]
	return prevSong, true
	// return room.songsQueue[room.currentSongIdx], true
}

// Get current song
func (h *Hub) CurrentSong(roomID string) (currSong Song, status bool) {
	h.mux.RLock()
	defer h.mux.RUnlock()

	room, ok := h.rooms[roomID]
	if !ok || room.currentSongIdx < 0 || room.currentSongIdx >= len(room.songsQueue) {
		return Song{}, false
	}

	currSong = room.songsQueue[room.currentSongIdx]
	return currSong, true

	// return room.songsQueue[room.currentSongIdx], true
}

// ---- User Management ----

// Get all users in a room
func (h *Hub) GetRoomUsers(roomID string) []*User {
	h.mux.RLock()
	defer h.mux.RUnlock()

	room, ok := h.rooms[roomID]
	if !ok {
		return []*User{}
	}

	users := make([]*User, 0, len(room.clients))
	for client := range room.clients {
		if client.User != nil {
			users = append(users, client.User)
		}
	}

	return users
}

// Broadcast user list to all clients in room
func (h *Hub) BroadcastUsers(roomID string) {
	users := h.GetRoomUsers(roomID)
	event := Event{
		Type:  "all_users",
		Users: users,
	}
	h.Broadcast(roomID, event)
}

// Notify room when a user joins
func (h *Hub) NotifyUserJoin(roomID string, user *User) {
	event := Event{
		Type: "user_joined",
		User: user,
	}
	h.Broadcast(roomID, event)
}

// Notify room when a user leaves
func (h *Hub) NotifyUserLeave(roomID string, user *User) {
	event := Event{
		Type: "user_left",
		User: user,
	}
	h.Broadcast(roomID, event)
}
