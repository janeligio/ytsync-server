const Events = require('../events/events');

class ChatRoom {
	constructor(room, io) {
        this.room = room;
        this.io = io;
        this.messages = [];
	}

    setMessage(message) {
        if(this.messages.length > 500) {
            let length = this.messages.length;
            let newer = this.messages.slice(Math.floor(length/2), length);
            this.messages = [...newer, message];
            this.io.in(this.room).emit(Events.receive_message, message);
        } else {
            this.messages = [...this.messages, message];
            this.io.in(this.room).emit(Events.receive_message, message);
        }
    }
    getMessages() {
        return this.messages;
    }
}

module.exports = ChatRoom;