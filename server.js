const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const { randomId, generateAlias, parseURL } = require('./utility/utility');
const Events = require('./events/events');
const ChatRoom = require('./Models/ChatRoom');
const Message = require('./Models/Message');
const API_KEY = require('./apiKey');
const { log } = console;
const port = process.env.PORT || 8080;

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
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

const server = http.createServer(app);
const io = socketIO(server);

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
    socket.on(Events.create_room, (id, callback) => {
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
                socket.join(room);
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
            // if(chatHistory.length > 0) {
            //     socket.emit(Events.receive_all_messages, chatHistory);	// Send the messages to that socket
            // }
            // socket.emit(Events.get_queue, queue);
            // socket.emit(Events.get_current_video, currentVideo);
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

    /* Events related to clients sending messages */

    // Event: Client wants to send a message.
    socket.on(Events.send_message, (room, id, text) => {
        let message = new Message(room, id, text, 'chat');
        YTsyncRooms.get(room).setMessage(message);
    });

    // Event: Client is typing.
    socket.on(Events.typing, (room, id) => {
        socket.to(room).emit(Events.typing, id);
    })

    /* Events related to manipulating the queue */
    socket.on(Events.add_to_queue, (room, videoId) => {
        log(`Adding ${videoId} to queue in room: ${room}`);
        YTsyncRooms.get(room).addToQueue(videoId);
    })
    /* Events related to manipulating the video player. */

    // Client: Whatever time in the video it is, play the video
    socket.on(Events.player_play, (room) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        YTsyncRoom.playVideo(socket);
    })
    socket.on(Events.player_play_at, (room, currentTime, playerState) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        YTsyncRoom.playVideoAt(socket, currentTime, playerState);
    })
    socket.on(Events.player_pause, (room, playerState) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        YTsyncRoom.pauseVideo(socket, playerState);
    })
    socket.on(Events.player_get_status, (room, callback) => {
        const status = { currentTime:0, playerState:-1};

        const connectedClients = new Set([...rooms.get(room)]);
        connectedClients.delete(socket.id);
        if(connectedClients.size > 0) {
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
        YTsyncRoom.setCurrentTime(state.currentTime);
        YTsyncRoom.setPlayerState(state.playerState);
    })
});


io.of("/").adapter.on("leave-room", (room, id) => {
    // If socket leaves a room, check if it has any people in it. 
    // If not, delete the room.
    const currRoom = rooms.get(room);
    if(currRoom.size === 0 && YTsyncRooms.has(room)) {
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