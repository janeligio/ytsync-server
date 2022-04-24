import { Server } from 'socket.io';
const Events = require('../events/events');
const { log } = require('../utility/utility.ts');
import ClientToServerEvents from '../events/ClientToServerEvents';
import ServerToClientEvents from '../events/ServerToClientEvents';
import Message from './Message';

enum PlayerState {
    Unstarted = -1,
    Ended = 0,
    Playing = 1,
    Paused = 2,
    Buffering = 3,
    VideoCued = 5,
}

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

    addToQueue(videoId) {
        if (videoId.length > 0) {
            this.queue.push(videoId);
            this.io.in(this.room).emit(Events.add_to_queue, this.room, videoId);
        }
    }
    removeFromQueue(index) {
        const isEmpty = this.queue.length === 0;
        const inBounds = !(index < 0) && index < this.queue.length;
        if (
            this.currentVideo === this.queue.length - 1 &&
            this.currentVideo !== 0
        ) {
            this.currentVideo = this.currentVideo - 1;
            this.io
                .in(this.room)
                .emit(Events.get_current_video, this.currentVideo);
        }

        if (!isEmpty && inBounds) {
            const newArray = [
                ...this.queue.slice(0, index),
                ...this.queue.slice(index + 1, this.queue.length),
            ];
            this.queue = newArray;
            this.io.in(this.room).emit(Events.remove_from_queue, this.queue);
        } else {
            // log(`Room: ${this.room} Error removing video from queue`);
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
    setPlayerState(state) {
        // console.log(`Setting player state:${state}`);
        this.playerState = state;
    }
    getPlayerState() {
        return this.playerState;
    }
    playVideo(socket) {
        this.playerState = 1;
        const data = {
            room: this.room,
        };
        socket.to(this.room).emit(Events.player_play, data);
    }
    playVideoAt(socket, time, playerState) {
        this.currentTime = time;
        this.playerState = playerState;
        const data = {
            room: this.room,
            currentTime: this.currentTime,
            playerState: this.playerState,
        };
        socket.to(this.room).emit(Events.player_play_at, data);
    }
    pauseVideo(socket, playerState) {
        this.playerState = playerState;
        const data = {
            room: this.room,
            playerState: this.playerState,
            currentTime: this.currentTime,
        };
        socket.to(this.room).emit(Events.player_pause, data);
    }
    loadVideo(socket, index) {
        // log(`Loading video#${index}`)
        const isEmpty = this.queue.length === 0;
        const inBounds = !(index < 0) && index < this.queue.length;
        const isSameVideo = index === this.currentVideo;

        if (!isEmpty && inBounds && !isSameVideo) {
            this.stopInterval();
            this.currentVideo = index;
            this.currentTime = 0;

            socket.to(this.room).emit(Events.get_current_video, index);
            socket.to(this.room).emit(Events.player_load_video, index);
        } else {
            // log(`Room: ${this.room}, Error loading video #${index}`)
        }
    }
    setMessage(message) {
        if (message.message.length > 0) {
            if (this.messages.length > 500) {
                this.io.in(this.room).emit(Events.receive_message, message);
                let length = this.messages.length;
                let newer = this.messages.slice(Math.floor(length / 2), length);
                this.messages = newer;
                this.messages.push(message);
            } else {
                this.io.in(this.room).emit(Events.receive_message, message);
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
