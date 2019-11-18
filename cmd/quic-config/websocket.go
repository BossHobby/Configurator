package main

import (
	"encoding/json"
	"net/http"
	"sync"

	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
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

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	clients[conn] = true
	defer func() {
		conn.Close()
		delete(clients, conn)
	}()

	broadcastWebsocket("status", status)

	for {
		typ, data, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		if typ != websocket.TextMessage {
			continue
		}

		if fc == nil {
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

func broadcastQuic() {
	for {
		select {
		case msg := <-controller.QuicLog:
			broadcastWebsocket("log", msg)
		case msg := <-controller.QuicBlackbox:
			broadcastWebsocket("blackbox", msg)
		}
	}
}
