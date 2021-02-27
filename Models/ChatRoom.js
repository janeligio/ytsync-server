const Events = require('../events/events');
const { log } = require('../utility/utility');

class ChatRoom {
	constructor(room, io) {
        this.room = room;
        this.io = io;
        this.messages = [];
        this.queue = [];
        this.currentVideo = 0;
        this.currentTime = 0;
        this.playerState = -1; // domain: [-1, 0, 1, 2, 3, 5]
	}

    addToQueue(videoId) {
        if(videoId.length > 0) {
            this.io.in(this.room).emit(Events.add_to_queue, this.room, videoId);
            this.queue.push(videoId);
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
        console.log(`Setting player state:${state}`);
        this.playerState = state;
    }
    getPlayerState() {
        return this.playerState;
    }
    playVideo(currentTime) {
        this.io.in(this.room).emit(Events.player_play, this.room, currentTime);
        this.playerState = 1;
    }
    pauseVideo() {
        this.io.in(this.room).emit(Events.player_pause, this.room);
        this.playerState = 2;
    }
    setMessage(message) {
        if(message.message.length > 0) {
            if(this.messages.length > 500) {
                this.io.in(this.room).emit(Events.receive_message, message);
                let length = this.messages.length;
                let newer = this.messages.slice(Math.floor(length/2), length);
                this.messages = newer;
                this.message.push(message);
            } else {
                this.io.in(this.room).emit(Events.receive_message, message);
                this.messages.push(message);
            }
        }
    }
    getMessages() {
        return this.messages;
    }
}

module.exports = ChatRoom;