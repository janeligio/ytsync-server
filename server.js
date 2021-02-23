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

const rooms = io.of("/").adapter.rooms; // Map<SocketID, Set<Room>>
const sids = io.of("/").adapter.sids; // Map<Room, Set<SocketID>>

let chatRooms = new Map(); // Map<RoomID, ChatRoom>

io.on('connection', socket => {
    log(`socket#${socket.id} connected.`)
    
    socket.emit(Events.assign_id, randomId(4));

    socket.on(Events.join_room, (room, id, callback) => {
        if(chatRooms.get(room)) {// If room exists join the room and get its messages
            socket.join(room);
            chatRooms.get(room).setMessage(new Message(room, id, `Welcome #${id}`));
            const history = chatRooms.get(room).getMessages();	// Get the chat rooms messages
            socket.emit(Events.receive_all_messages, history);	// Send the messages to that socket
        } else { // If the room doesn't exist make one and join that room
            chatRooms.set(room, new ChatRoom(room, io));
            log('New chatroom');
            let socketRooms = sids.get(socket.id);
            if(socketRooms.has(socket.id) && socketRooms.size === 1) { // Not in any rooms
                socket.join(room);
                chatRooms.get(room).setMessage(new Message(room, id, `Welcome #${id}`));
            } else { // Remove from other rooms
                const roomToLeave = [...socketRooms][1];
                socket.leave(roomToLeave);
                log(`#${socket.id} leaving room:${roomToLeave}`);
                socket.join(room);
            }
        }
        
        callback({
            status:'ok',
            room:room
        })
    });

    socket.on(Events.send_message, (room, id, text) => {
        let message = new Message(room, id, text);
        chatRooms.get(room).setMessage(message);
    });

    socket.on(Events.typing, (room, id) => {
        socket.to(room).emit(Events.typing, id);
    })
});

server.listen(port, () => {
    console.log(`Listening on PORT:${port}`);
});