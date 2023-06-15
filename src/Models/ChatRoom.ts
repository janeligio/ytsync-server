import { Server, Socket } from 'socket.io';
const Events = require('../events/events');
import ClientToServerEvents from '../events/ClientToServerEvents';
import ServerToClientEvents, {
    ServerToClientEventsTypes,
} from '../events/ServerToClientEvents';
import PlayerState from '../types/PlayerState';
import Message from './Message';

export default class ChatRoom {
    room: string;
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    messages: Message[];
    /** Contains an array of YouTube video IDs */
    queue: string[];
    currentVideo: number;
    currentTime: number;
    playerState: PlayerState;
    interval: NodeJS.Timeout;

    constructor(
        room: string,
        io: Server<ClientToServerEvents, ServerToClientEvents>
    ) {
        this.room = room;
        this.io = io;
        this.messages = [];
        this.queue = [];
        this.currentVideo = 0;
        this.currentTime = 0;
        this.playerState = PlayerState.Unstarted; // domain: [-1, 0, 1, 2, 3, 5]
        this.interval = null;
    }

    addToQueue(videoId: string) {
        if (videoId.length > 0) {
            this.queue.push(videoId);
            this.io
                .in(this.room)
                .emit(ServerToClientEventsTypes.addToQueue, this.room, videoId);
        }
    }

    removeFromQueue(index: number) {
        const isEmpty = this.queue.length === 0;
        const inBounds = !(index < 0) && index < this.queue.length;
        if (
            this.currentVideo === this.queue.length - 1 &&
            this.currentVideo !== 0
        ) {
            this.currentVideo = this.currentVideo - 1;
            this.io
                .in(this.room)
                .emit(
                    ServerToClientEventsTypes.getCurrentVideo,
                    this.currentVideo
                );
        }

        if (!isEmpty && inBounds) {
            const newArray = [
                ...this.queue.slice(0, index),
                ...this.queue.slice(index + 1, this.queue.length),
            ];
            this.queue = newArray;
            this.io
                .in(this.room)
                .emit(ServerToClientEventsTypes.removeFromQueue, this.queue);
        } else {
            console.log(`Room: ${this.room} Error removing video from queue`);
        }
    }

    getQueue() {
        return this.queue;
    }

    getCurrentVideo() {
        return this.currentVideo;
    }

    getCurrentTime() {
        return this.currentTime;
    }

    setCurrentTime(currentTime) {
        this.currentTime = currentTime;
    }

    setPlayerState(playerState: PlayerState) {
        // console.log(`Setting player state:${state}`);
        this.playerState = playerState;
    }

    getPlayerState() {
        return this.playerState;
    }

    playVideo(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
        this.playerState = PlayerState.Playing;

        socket
            .to(this.room)
            .emit(ServerToClientEventsTypes.playVideo, PlayerState.Playing);
    }

    playVideoAt(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        time: number,
        playerState: PlayerState
    ) {
        this.currentTime = time;
        this.playerState = playerState;

        const data = {
            currentTime: this.currentTime,
            playerState: this.playerState,
        };

        socket.to(this.room).emit(ServerToClientEventsTypes.playVideoAt, data);
    }

    pauseVideo(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        playerState: PlayerState
    ) {
        this.playerState = playerState;

        const data = {
            playerState: this.playerState,
            currentTime: this.currentTime,
        };

        socket.to(this.room).emit(ServerToClientEventsTypes.pauseVideo, data);
    }

    loadVideo(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        index: number
    ) {
        // log(`Loading video#${index}`)
        const isEmpty = this.queue.length === 0;
        const inBounds = !(index < 0) && index < this.queue.length;
        const isSameVideo = index === this.currentVideo;

        if (!isEmpty && inBounds && !isSameVideo) {
            this.stopInterval();
            this.currentVideo = index;
            this.currentTime = 0;

            socket
                .to(this.room)
                .emit(ServerToClientEventsTypes.getCurrentVideo, index);
            socket
                .to(this.room)
                .emit(ServerToClientEventsTypes.loadVideo, index);
        } else {
            console.log(`Room: ${this.room}, Error loading video #${index}`);
        }
    }

    setMessage(message: Message) {
        if (message.message.length > 0) {
            if (this.messages.length > 500) {
                this.io.in(this.room).emit(Events.receive_message, message);

                let length = this.messages.length;
                let newer = this.messages.slice(Math.floor(length / 2), length);

                this.messages = newer;
                this.messages.push(message);
            } else {
                this.io
                    .in(this.room)
                    .emit(ServerToClientEventsTypes.receiveMessage, message);
                this.messages.push(message);
            }
        }
    }

    getMessages() {
        return this.messages;
    }

    startInterval() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(() => {
            // log(`Setting room ${this.room}'s current time to ${this.currentTime+2}`);
            this.currentTime = this.currentTime + 2;
        }, 2000);
    }

    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

module.exports = ChatRoom;
