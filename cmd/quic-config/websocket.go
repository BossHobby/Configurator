package main

import (
	"encoding/json"
	"net/http"
	"sync"

	log "github.com/sirupsen/logrus"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var clientsMu sync.Mutex
var clients = make(map[*websocket.Conn]bool)

type websocketPacket struct {
	Channel string
	Payload interface{}
}

func broadcastWebsocket(channel string, v interface{}) error {
	p := websocketPacket{
		Channel: channel,
		Payload: v,
	}

	clientsMu.Lock()
	defer clientsMu.Unlock()

	for conn := range clients {
		if err := conn.WriteJSON(p); err != nil {
			log.Println(err)
		}
	}
	return nil
}

func sendWebsocket(conn *websocket.Conn, channel string, v interface{}) error {
	p := websocketPacket{
		Channel: channel,
		Payload: v,
	}
	if err := conn.WriteJSON(p); err != nil {
		return err
	}
	return nil
}

func (s *Server) websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	clientsMu.Lock()
	clients[conn] = true
	defer func() {
		clientsMu.Lock()
		defer clientsMu.Unlock()

		conn.Close()
		delete(clients, conn)
	}()
	clientsMu.Unlock()

	sendWebsocket(conn, "status", s.status)

	for {
		typ, data, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		if typ != websocket.TextMessage {
			continue
		}

		if s.fc == nil {
			return
		}

		p := new(websocketPacket)
		if err := json.Unmarshal(data, p); err != nil {
			log.Println(err)
			return
		}

		value := new(map[string]interface{})
		switch p.Channel {

		}
		if err := sendWebsocket(conn, p.Channel, value); err != nil {
			log.Println(err)
			return
		}
	}
}
