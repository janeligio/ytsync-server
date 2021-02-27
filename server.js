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

let chatRooms = new Map(); // Map<RoomID, ChatRoom>
let aliases = new Map(); // Map<SocketID, Alias>

io.on('connection', socket => {
    log(`socket#${socket.id} connected.`)
    const alias = generateAlias();
    socket.emit(Events.assign_id, alias);
    aliases.set(socket.id, alias);

    socket.on(Events.create_room, (id, callback) => {
        const roomId = randomId(4);
        const roomExists = chatRooms.has(roomId);
        if(!roomExists) {
            chatRooms.set(roomId, new ChatRoom(roomId, io));
            log('New chatroom');
            let socketRooms = sids.get(socket.id);
            if(socketRooms.has(socket.id) && socketRooms.size === 1) { // Not in any rooms
                socket.join(roomId);
            } else { // Remove from other rooms
                const roomToLeave = [...socketRooms][1];
                socket.leave(roomToLeave);
                log(`#${socket.id} leaving room:${roomToLeave}`);
                socket.join(room);
            }
        }
        callback({ status:'ok', room:roomId });
    })

    socket.on(Events.join_room, (room, id, callback) => {
        let roomExists = chatRooms.has(room);
        let status;
        let errors = '';

        if(roomExists) {
            socket.join(room);
            status = 'ok';
            chatRooms.get(room).setMessage(new Message(room, id, `${id} has joined the room.`, 'welcome'));
            const chatHistory = chatRooms.get(room).getMessages();	// Get the chat rooms messages
            const queue = chatRooms.get(room).getQueue();
            const currentVideo = chatRooms.get(room).getCurrentVideo();
            if(chatHistory.length > 0) {
                socket.emit(Events.receive_all_messages, chatHistory);	// Send the messages to that socket
            }
            socket.emit(Events.get_queue, queue);
            socket.emit(Events.get_current_video, currentVideo);
        } else {
            status = 'bad';
            errors += 'Room does not exist.';
        }
        callback({ status, room, errors });
    });

    socket.on(Events.leave_room, (room, callback) => {
        socket.leave(room);
        callback({ status:'ok'})
    })

    socket.on(Events.send_message, (room, id, text) => {
        let message = new Message(room, id, text, 'chat');
        chatRooms.get(room).setMessage(message);
    });

    socket.on(Events.typing, (room, id) => {
        socket.to(room).emit(Events.typing, id);
    })

    socket.on(Events.add_to_queue, (room, videoId) => {
        log('add to queue event');
        chatRooms.get(room).addToQueue(videoId);
    })
    socket.on(Events.player_play, (room, currentTime, playerState) => {
        chatRooms.get(room).playVideo(currentTime);
        chatRooms.get(room).setCurrentTime(currentTime);
        chatRooms.get(room).setPlayerState(playerState);
    })
    socket.on(Events.player_pause, (room, playerState, currentTime) => {
        chatRooms.get(room).pauseVideo();
        chatRooms.get(room).setCurrentTime(currentTime);
        chatRooms.get(room).setPlayerState(playerState);
    })
    socket.on('player play video', videoId => {
        log(`videoId: ${videoId}`);
    })
    socket.on(Events.player_get_status, (room, callback) => {
        const playerState = chatRooms.get(room).getPlayerState();
        const currentTime = chatRooms.get(room).getCurrentTime();
        callback({ state: playerState, currentTime});
    })
    socket.on('player set current time', (room, currentTime) => {
        const chatRoom = chatRooms.get(room);
        if(chatRoom) {
            chatRoom.setCurrentTime(currentTime);
        }
    })
});

io.of("/").adapter.on("leave-room", (room, id) => {
    // If socket leaves a room, check if it has any people in it. 
    // If not, delete the room.
    const currRoom = rooms.get(room);
    if(currRoom.size === 0 && chatRooms.has(room)) {
        chatRooms.delete(room);
        log('deleting chatroom')
    } else if(chatRooms.has(room)) {
        const alias = aliases.get(id);
        const fairwellMessage = new Message(room, '', `${alias} has left the room.`, 'fairwell');
        chatRooms.get(room).setMessage(fairwellMessage);
    }
    log(currRoom);
});

server.listen(port, () => {
    console.log(`Listening on PORT:${port}`);
});