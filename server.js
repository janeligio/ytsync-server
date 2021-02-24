const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { randomId } = require('./utility/utility');
const Events = require('./events/events');
const ChatRoom = require('./Models/ChatRoom');
const Message = require('./Models/Message');
const { log } = console;
const port = process.env.PORT || 8080;

const app = express();

app.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
});

const server = http.createServer(app);
const io = socketIO(server);

const rooms = io.of("/").adapter.rooms; // Map<Room, Set<Room>>
const sids = io.of("/").adapter.sids; // Map<SocketID, Set<SocketID>>

let chatRooms = new Map(); // Map<RoomID, ChatRoom>

io.on('connection', socket => {
    log(`socket#${socket.id} connected.`)
    
    socket.emit(Events.assign_id, randomId(4));

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
        if(roomExists) {
            socket.join(room);
            chatRooms.get(room).setMessage(new Message(room, id, `Welcome #${id}`));
            const chatHistory = chatRooms.get(room).getMessages();	// Get the chat rooms messages
            if(chatHistory.length > 0) {
                socket.emit(Events.receive_all_messages, chatHistory);	// Send the messages to that socket
            }
        }
        let status;
        let errors = '';
        if(rooms.get(room).has(socket.id)) {
            status =  'ok';
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
        let message = new Message(room, id, text);
        chatRooms.get(room).setMessage(message);
    });

    socket.on(Events.typing, (room, id) => {
        socket.to(room).emit(Events.typing, id);
    })

    socket.on(Events.add_to_queue, (room, videoId) => {
        chatRooms.get(room).addToQueue(videoId);
    })
    socket.on(Events.player_play, (room, currentTime) => {
        chatRooms.get(room).playVideo(currentTime);
    })
    socket.on(Events.player_pause, (room) => {
        chatRooms.get(room).pauseVideo();
    })
});

io.of("/").adapter.on("leave-room", (room, id) => {
    // If socket leaves a room, check if it has any people in it. 
    // If not, delete the room.
    const currRoom = rooms.get(room);
    if(currRoom.size === 0 && chatRooms.has(room)) {
        chatRooms.delete(room);
        log('deleting chatroom')
    }
    log(currRoom);
});

server.listen(port, () => {
    console.log(`Listening on PORT:${port}`);
});