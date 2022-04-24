import { Server, Socket } from 'socket.io';
import { randomId } from '../../utility/utility';

import { Aliases, YTsyncRooms } from '../../state';
import ChatRoom from '../../Models/ChatRoom';
import Message, { MessageType } from '../../Models/Message';

import ClientToServerEvents, {
    ClientToServerEventsTypes,
} from '../ClientToServerEvents';
import ServerToClientEvents, {
    ServerToClientEventsTypes,
} from '../ServerToClientEvents';

/** Attaches events related to ChatRooms including:
 *
 *  - Creating a new room
 * - Joining a room
 * - Leaving a room
 * - Changing name
 * - Sending a message
 */
export default function attachRoomEvents(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
    const rooms = io.of('/').adapter.rooms; // Map<Room, Set<SocketID>>
    const sids = io.of('/').adapter.sids; // Map<SocketID, Set<Room>>

    socket.on(ClientToServerEventsTypes.createRoom, (clientAlias, callback) => {
        const roomId = randomId(4);
        const roomExists = YTsyncRooms.has(roomId);
        const callbackMessage = { status: '', room: roomId, error: '' };

        if (!roomExists) {
            YTsyncRooms.set(roomId, new ChatRoom(roomId, io));

            console.log(`Chatroom created: ${roomId}`);

            let socketRooms = sids.get(socket.id);
            if (socketRooms.has(socket.id) && socketRooms.size === 1) {
                // Not in any other rooms, so join room.
                socket.join(roomId);
            } else {
                // Remove from other rooms and join room.
                const roomToLeave = [...socketRooms][1];

                socket.leave(roomToLeave);

                console.log(`#${socket.id} leaving room:${roomToLeave}`);

                // if (room) {
                //     socket.join(room);
                // }
            }

            const YTsyncRoom = YTsyncRooms.get(roomId);
            if (YTsyncRoom) {
                YTsyncRoom.setMessage(
                    new Message(
                        roomId,
                        clientAlias,
                        `${clientAlias} has created a room.`,
                        MessageType.Welcome
                    )
                );

                const chatHistory = YTsyncRoom.getMessages(); // Get the chat rooms messages
                const queue = YTsyncRoom.getQueue();
                const currentVideo = YTsyncRoom.getCurrentVideo();

                socket.emit(ServerToClientEventsTypes.receiveRoomState, {
                    chatHistory,
                    queue,
                    currentVideo,
                });
            }

            callbackMessage.status = 'ok';
        } else {
            callbackMessage.error = `Error creating room: ${roomId}`;
        }
        callback(callbackMessage);
    });

    // Event: Client joins an existing room.
    socket.on(ClientToServerEventsTypes.joinRoom, (room, callback) => {
        let roomExists = YTsyncRooms.has(room);
        const clientAlias = Aliases.get(socket.id);
        let status;
        let errors = '';

        if (roomExists) {
            socket.join(room);

            const YTsyncRoom = YTsyncRooms.get(room);

            YTsyncRoom.setMessage(
                new Message(
                    room,
                    clientAlias,
                    `${clientAlias} has joined the room.`,
                    MessageType.Welcome
                )
            );

            const chatHistory = YTsyncRoom.getMessages(); // Get the chat rooms messages
            const queue = YTsyncRoom.getQueue();
            const currentVideo = YTsyncRoom.getCurrentVideo();

            socket.emit(ServerToClientEventsTypes.receiveRoomState, {
                chatHistory,
                queue,
                currentVideo,
            });

            status = 'ok';
        } else {
            status = 'bad';
            errors += 'Room does not exist.';
        }
        callback({ status, room, errors });
    });

    // Event: Client wants to leave a room.
    socket.on(ClientToServerEventsTypes.leaveRoom, (room, callback) => {
        socket.leave(room);
        callback({ status: 'ok' });
    });

    socket.on(ClientToServerEventsTypes.changeName, (newName) => {
        const oldAlias = Aliases.get(socket.id);

        if (oldAlias && oldAlias.length > 0) {
            if (oldAlias !== newName) {
                console.log(
                    `Socket#${socket.id} changing ${oldAlias} to ${newName}`
                );

                Aliases.set(socket.id, newName);

                socket.emit(ServerToClientEventsTypes.assignAlias, newName);

                const socketRooms = sids.get(socket.id);

                if (socketRooms) {
                    let socketRoomsArr = [...socketRooms];
                    socketRoomsArr = socketRoomsArr.filter(
                        (room) => socket.id !== room
                    );
                    if (socketRoomsArr.length > 0) {
                        const YTsyncRoom = YTsyncRooms.get(socketRoomsArr[0]);
                        if (YTsyncRoom) {
                            YTsyncRoom.setMessage(
                                new Message(
                                    YTsyncRoom.room,
                                    newName,
                                    `${oldAlias} has changed their name to ${newName}.`,
                                    MessageType.Welcome
                                )
                            );
                        }
                    }
                }
            }
        }
    });

    // Event: Client wants to send a message.
    socket.on(ClientToServerEventsTypes.sendMessage, (room, id, text) => {
        let message = new Message(room, id, text, MessageType.Chat);
        const YTsyncRoom = YTsyncRooms.get(room);
        if (YTsyncRoom) {
            YTsyncRoom.setMessage(message);
        }
    });

    // Event: Client is typing.
    socket.on(ClientToServerEventsTypes.typing, (room, id) => {
        socket.to(room).emit(ServerToClientEventsTypes.typing, id);
    });

    /* Event: Client wants to add to the video queue. */
    socket.on(ClientToServerEventsTypes.addToQueue, (room, videoId) => {
        console.log(`Adding ${videoId} to queue in room: ${room}`);
        const YTsyncRoom = YTsyncRooms.get(room);

        if (YTsyncRoom) {
            YTsyncRoom.addToQueue(videoId);
            const clientAlias = Aliases.get(socket.id) || 'Someone';
            YTsyncRoom.setMessage(
                new Message(
                    room,
                    clientAlias,
                    `${clientAlias} has added a video to the queue.`,
                    MessageType.Welcome
                )
            );
        }
    });

    /* Event: Client wants to remove from the video queue. */
    socket.on(ClientToServerEventsTypes.removeFromQueue, (room, index) => {
        console.log(`Removing video#${index} from room #${room}`);

        const YTsyncRoom = YTsyncRooms.get(room);

        if (YTsyncRoom) {
            YTsyncRoom.removeFromQueue(index);

            const clientAlias = Aliases.get(socket.id) || 'Someone';

            YTsyncRoom.setMessage(
                new Message(
                    room,
                    clientAlias,
                    `${clientAlias} has removed a video from the queue.`,
                    MessageType.Welcome
                )
            );
        }
    });
}
