class Message {
    constructor(room, userId, message) {
        this.room = room;
        this.userId = userId;
        this.message = message;
        this.timestamp = new Date();
    }
}

module.exports = Message;