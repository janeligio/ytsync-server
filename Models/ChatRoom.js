const Events = require('../events/events');

class ChatRoom {
	constructor(room, io) {
        this.room = room;
        this.io = io;
        this.messages = [];
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