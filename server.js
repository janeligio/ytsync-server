const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const { randomId, generateAlias, parseURL } = require('./utility/utility');
const Events = require('./events/events');
const ChatRoom = require('./Models/ChatRoom');
const Message = require('./Models/Message');
const { log } = console;

const port = process.env.PORT || 8080;
let API_KEY;  

let app;
let server;
let io;

if (process.env.NODE_ENV === 'production') {
    API_KEY = process.env.API_KEY;
    app = express();
    app.use(cors());
    server = http.createServer(app);
    io = socketIO(server, {
        cors: {
          origin: "https://modest-benz-608ea8.netlify.app",
          methods: ["GET", "POST"]
        }
      });
} else {
    log(`NODE_ENV = ${process.env.NODE_ENV}`)
    API_KEY = require('./apiKey');
    app = express();
    app.use(cors());
    server = http.createServer(app);
    io = socketIO(server, {
        cors: {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"]
        }
      });
}



app.get("/", (req, res) => {
    res.json({ response: "I am alive" });
});

app.get("/video/:videoId", (req, res) => {
    const {videoId} = req.params;
    const requestURL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
    axios({
        method:'get',
        url: requestURL
    }).then(response => {
        const { snippet } = response.data.items[0];
        const { title, thumbnails, channelTitle } = snippet;
        res.json({title, thumbnails, channelTitle});
    }).catch(e => log(e))

})



const rooms = io.of("/").adapter.rooms; // Map<Room, Set<SocketID>>
const sids = io.of("/").adapter.sids; // Map<SocketID, Set<Room>>

const YTsyncRooms = new Map(); // Map<RoomID, ChatRoom>
const Aliases = new Map(); // Map<SocketID, Alias>

app.get('/room/:room', (req, res) => {
    const {room} = req.params;
    if(YTsyncRooms.has(room)) {
        const YTsyncRoom = YTsyncRooms.get(room);
        const currentTime = YTsyncRoom.getCurrentTime();
        const playerState = YTsyncRoom.getPlayerState();
        res.json({currentTime, playerState});
    } else {
        res.json({error:'Room does not exist.'});
    }

});
io.on('connection', socket => {
    const alias = generateAlias();
    socket.emit(Events.assign_id, alias);
    Aliases.set(socket.id, alias);

    log(`Socket#${socket.id} connected with alias: ${alias}.`)
    socket.on('disconnect', () => {
        log(`Socket#${socket.id} disconnected, alias:${Aliases.get(socket.id)}`);
        Aliases.delete(socket.id); // Remove its alias
    })

    /* Events related to ChatRooms */
    // Event: Client creates a room.
    socket.on(Events.create_room, (clientAlias, callback) => {
        const roomId = randomId(4);
        const roomExists = YTsyncRooms.has(roomId);
        const callbackMessage = { status: '', room: roomId, error: ''}
        if(!roomExists) {
            YTsyncRooms.set(roomId, new ChatRoom(roomId, io));
            log(`Chatroom created: ${roomId}`);
            let socketRooms = sids.get(socket.id);
            if(socketRooms.has(socket.id) && socketRooms.size === 1) { 
                // Not in any other rooms, so join room.
                socket.join(roomId);
            } else { 
                // Remove from other rooms and join room.
                const roomToLeave = [...socketRooms][1];
                socket.leave(roomToLeave);
                log(`#${socket.id} leaving room:${roomToLeave}`);
                if(room) {
                    socket.join(room);
                }
            }

            const YTsyncRoom = YTsyncRooms.get(roomId);
            if(YTsyncRoom) {
                YTsyncRoom.setMessage(new Message(roomId, clientAlias, `${clientAlias} has created a room.`, 'welcome'));
                const chatHistory = YTsyncRoom.getMessages();	// Get the chat rooms messages
                const queue = YTsyncRoom.getQueue();
                const currentVideo = YTsyncRoom.getCurrentVideo();
                socket.emit(Events.receive_room_state, {chatHistory, queue, currentVideo});
            }

            callbackMessage.status = 'ok';
        } else {
            callbackMessage.error = `Error creating room: ${roomId}`;
        }
        callback(callbackMessage);
    })

    // Event: Client joins an existing room.
    socket.on(Events.join_room, (room, callback) => {
        let roomExists = YTsyncRooms.has(room);
        const clientAlias = Aliases.get(socket.id)
        let status;
        let errors = '';

        if(roomExists) {
            socket.join(room);
            const YTsyncRoom = YTsyncRooms.get(room);
            YTsyncRoom.setMessage(new Message(room, clientAlias, `${clientAlias} has joined the room.`, 'welcome'));
            const chatHistory = YTsyncRoom.getMessages();	// Get the chat rooms messages
            const queue = YTsyncRoom.getQueue();
            const currentVideo = YTsyncRoom.getCurrentVideo();
            socket.emit(Events.receive_room_state, {chatHistory, queue, currentVideo});
            status = 'ok';
        } else {
            status = 'bad';
            errors += 'Room does not exist.';
        }
        callback({ status, room, errors });
    });
    // Event: Client wants to leave a room.
    socket.on(Events.leave_room, (room, callback) => {
        socket.leave(room);
        callback({ status:'ok'})
    })

    socket.on('change name', (newName) => {
        const oldAlias = Aliases.get(socket.id);
        if(oldAlias && oldAlias.length > 0) {
            if(oldAlias !== newName) {
                log(`socket#${socket.id} changing ${oldAlias} to ${newName}`);
                Aliases.set(socket.id, newName);
                socket.emit(Events.assign_id, newName);

                const socketRooms = sids.get(socket.id);
                if(socketRooms) {
                    let socketRoomsArr = [...socketRooms];
                    socketRoomsArr = socketRoomsArr.filter(room => socket.id !== room);
                    if(socketRoomsArr.length > 0) {
                        const YTsyncRoom = YTsyncRooms.get(socketRoomsArr[0]);
                        if(YTsyncRoom) {
                            YTsyncRoom.setMessage(new Message(YTsyncRoom.room, newName, `${oldAlias} has changed their name to ${newName}.`, 'welcome'));
                        }
                    }
                }
            }
        }
    })
    /* Events related to clients sending messages */

    // Event: Client wants to send a message.
    socket.on(Events.send_message, (room, id, text) => {
        let message = new Message(room, id, text, 'chat');
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.setMessage(message);
        }
    });

    // Event: Client is typing.
    socket.on(Events.typing, (room, id) => {
        socket.to(room).emit(Events.typing, id);
    })

    /* Events related to manipulating the queue */
    socket.on(Events.add_to_queue, (room, videoId) => {
        log(`Adding ${videoId} to queue in room: ${room}`);
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.addToQueue(videoId);
            const clientAlias = Aliases.get(socket.id) || 'Someone';
            YTsyncRoom.setMessage(new Message(room, clientAlias, `${clientAlias} has added a video to the queue.`, 'welcome'));
        }
    })
    /* Events related to manipulating the video player. */

    // Client: Whatever time in the video it is, play the video
    socket.on(Events.player_play, (room) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.playVideo(socket);
        }
    })
    socket.on(Events.player_play_at, (room, currentTime, playerState) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.playVideoAt(socket, currentTime, playerState);
        }
    })
    socket.on(Events.player_pause, (room, playerState) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.pauseVideo(socket, playerState);
        }
    })
    socket.on(Events.player_get_status, (room, callback) => {
        const status = { currentTime:0, playerState:-1};

        const connectedClients = new Set([...rooms.get(room)]);
        connectedClients.delete(socket.id);
        if(connectedClients.size > 0 && YTsyncRooms.has(room)) {
            const YTsyncRoom = YTsyncRooms.get(room);
            const currentTime = YTsyncRoom.getCurrentTime();
            const playerState = YTsyncRoom.getPlayerState();
            status.currentTime = currentTime;
            status.playerState = playerState;
        }
        callback(status);
    })
    socket.on('player play video', videoId => {
        log(`videoId: ${videoId}`);
    })

    socket.on('player set current state', (room, state) => {
        log(`Setting video status from socket#${socket.id}`)
        log(`currTime: ${state.currentTime} playerState: ${state.playerState}`);
        const YTsyncRoom = YTsyncRooms.get(room);
        if(YTsyncRoom) {
            YTsyncRoom.setCurrentTime(state.currentTime);
            YTsyncRoom.setPlayerState(state.playerState);            
        }
    })

    socket.on('player start interval', (room, currentTime) => {
        if(YTsyncRooms.has(room)) {
            const YTsyncRoom = YTsyncRooms.get(room);
            YTsyncRoom.startInterval(currentTime);
        }
    })
    socket.on('player stop interval', (room, currentTime) => {
        if(YTsyncRooms.has(room)) {
            const YTsyncRoom = YTsyncRooms.get(room);
            YTsyncRoom.stopInterval();
        }
    })
});


io.of("/").adapter.on("leave-room", (room, id) => {
    // If socket leaves a room, check if it has any people in it. 
    // If not, delete the room.
    const currRoom = rooms.get(room);
    if(currRoom.size === 0 && YTsyncRooms.has(room)) {
        const YTsyncRoom = YTsyncRooms.get(room);
        YTsyncRoom.stopInterval();
        YTsyncRooms.delete(room);
        log(`Deleting chatroom: ${room}`);
    } else if(YTsyncRooms.has(room)) {
        // Send a fairwell message to the chatroom
        const alias = Aliases.get(id);
        const fairwellMessage = new Message(room, '', `${alias} has left the room.`, 'fairwell');
        YTsyncRooms.get(room).setMessage(fairwellMessage);
    }
});

server.listen(port, () => {
    console.log(`Listening on PORT:${port}`);
});