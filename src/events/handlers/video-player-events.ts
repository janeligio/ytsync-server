import { Server, Socket } from 'socket.io';

import { YTsyncRooms } from '../../state';

import ClientToServerEvents, {
    ClientToServerEventsTypes,
} from '../ClientToServerEvents';
import ServerToClientEvents from '../ServerToClientEvents';

/** Events related to manipulating the video player.
 *
 * - Play
 * - Pause
 * - Seek
 * - Load video
 * - Getting video player status
 */
export default function attachVideoPlayerEvents(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
    const rooms = io.of('/').adapter.rooms; // Map<Room, Set<SocketID>>
    const sids = io.of('/').adapter.sids; // Map<SocketID, Set<Room>>

    // Client: Whatever time in the video it is, play the video
    socket.on(ClientToServerEventsTypes.play, (room) => {
        const YTsyncRoom = YTsyncRooms.get(room);

        if (YTsyncRoom) {
            YTsyncRoom.playVideo(socket);
        }
    });

    socket.on(
        ClientToServerEventsTypes.playAt,
        (room, currentTime, playerState) => {
            const YTsyncRoom = YTsyncRooms.get(room);

            if (YTsyncRoom) {
                YTsyncRoom.playVideoAt(socket, currentTime, playerState);
            }
        }
    );

    socket.on(ClientToServerEventsTypes.pause, (room, playerState) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        if (YTsyncRoom) {
            YTsyncRoom.pauseVideo(socket, playerState);
        }
    });

    socket.on(ClientToServerEventsTypes.getStatus, (room, callback) => {
        const status = { currentTime: 0, playerState: -1 };

        const connectedClients = new Set([...rooms.get(room)]);
        connectedClients.delete(socket.id);
        if (connectedClients.size > 0 && YTsyncRooms.has(room)) {
            const YTsyncRoom = YTsyncRooms.get(room);
            const currentTime = YTsyncRoom.getCurrentTime();
            const playerState = YTsyncRoom.getPlayerState();
            status.currentTime = currentTime;
            status.playerState = playerState;
        }
        callback(status);
    });

    socket.on(ClientToServerEventsTypes.loadVideo, (room, index) => {
        const YTsyncRoom = YTsyncRooms.get(room);
        if (YTsyncRoom) {
            YTsyncRoom.loadVideo(socket, index);
        }
    });

    socket.on(ClientToServerEventsTypes.setState, (room, state) => {
        console.log(`Setting video status from socket#${socket.id}`);
        console.log(
            `currTime: ${state.currentTime} playerState: ${state.playerState}`
        );

        const YTsyncRoom = YTsyncRooms.get(room);

        if (YTsyncRoom) {
            YTsyncRoom.setCurrentTime(state.currentTime);
            YTsyncRoom.setPlayerState(state.playerState);
        }
    });

    socket.on(ClientToServerEventsTypes.startInterval, (roomId) => {
        if (YTsyncRooms.has(roomId)) {
            const YTsyncRoom = YTsyncRooms.get(roomId);
            YTsyncRoom.startInterval();
        }
    });

    socket.on(ClientToServerEventsTypes.stopInterval, (roomId) => {
        if (YTsyncRooms.has(roomId)) {
            const YTsyncRoom = YTsyncRooms.get(roomId);
            YTsyncRoom.stopInterval();
        }
    });
}
