import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';

import AppRouter from './routes';
import ClientToServerEvents from './events/ClientToServerEvents';
import ServerToClientEvents, {
    ServerToClientEventsTypes,
} from './events/ServerToClientEvents';

import { YTsyncRooms, Aliases } from './state';

import { generateAlias } from './utility/utility';
import Message, { MessageType } from './Models/Message';

import 'dotenv/config';
import attachRoomEvents from './events/handlers/room-events';
import attachVideoPlayerEvents from './events/handlers/video-player-events';

const port = process.env.PORT || 3001;

const app: express.Application = express().use(cors());
const server: http.Server = http.createServer(app);

let io: Server<ClientToServerEvents, ServerToClientEvents>;

if (process.env.NODE_ENV === 'production') {
    io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: process.env.CLIENT_ORIGIN,
            methods: ['GET', 'POST'],
        },
    });
} else {
    io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });
}

app.use('/', AppRouter);

const rooms = io.of('/').adapter.rooms; // Map<Room, Set<SocketID>>
const sids = io.of('/').adapter.sids; // Map<SocketID, Set<Room>>

io.on(
    'connection',
    (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
        const alias = generateAlias();

        Aliases.set(socket.id, alias);
        socket.emit(ServerToClientEventsTypes.assignAlias, alias);

        console.log(`Socket#${socket.id} connected with alias: ${alias}.`);

        socket.on('disconnect', () => {
            console.log(
                `Socket#${socket.id} disconnected, alias:${Aliases.get(
                    socket.id
                )}`
            );
            Aliases.delete(socket.id); // Remove its alias
        });

        attachRoomEvents(io, socket);
        attachVideoPlayerEvents(io, socket);
    }
);

io.of('/').adapter.on('leave-room', (room, id) => {
    // If socket leaves a room, check if it has any people in it.
    // If not, delete the room.
    const currRoom = rooms.get(room);
    if (currRoom.size === 0 && YTsyncRooms.has(room)) {
        const YTsyncRoom = YTsyncRooms.get(room);
        YTsyncRoom.stopInterval();
        YTsyncRooms.delete(room);

        console.log(`Deleting chatroom: ${room}`);
    } else if (YTsyncRooms.has(room)) {
        // Send a fairwell message to the chatroom
        const alias = Aliases.get(id);
        const fairwellMessage = new Message(
            room,
            '',
            `${alias} has left the room.`,
            MessageType.Fairwell
        );
        YTsyncRooms.get(room).setMessage(fairwellMessage);
    }
});

server.listen(port, () => {
    console.log(`Listening on PORT:${port}`);
});
