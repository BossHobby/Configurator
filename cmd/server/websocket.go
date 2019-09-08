package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/NotFastEnuf/configurator/controller"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var clients = make(map[*websocket.Conn]bool)

type websocketPacket struct {
	Channel string
	Payload interface{}
}

func broacastWebsocket(channel string, v interface{}) error {
	p := websocketPacket{
		Channel: channel,
		Payload: v,
	}
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

	broacastWebsocket("status", status)

	for {
		typ, data, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		if typ != websocket.TextMessage {
			continue
		}

		p := new(websocketPacket)
		if err := json.Unmarshal(data, p); err != nil {
			log.Println(err)
			return
		}
		log.Printf("ws: %+v\n", p)

		value := new(map[string]interface{})
		switch p.Channel {
		case "vbat":
			if err := fc.GetQUIC(controller.QuicValVbat, value); err != nil {
				log.Println(err)
				return
			}
		case "rx":
			if err := fc.GetQUIC(controller.QuicValRx, value); err != nil {
				log.Println(err)
				return
			}
		}
		if err := sendWebsocket(conn, p.Channel, value); err != nil {
			log.Println(err)
			return
		}
	}
}
