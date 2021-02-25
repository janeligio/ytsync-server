class Message {
    constructor(room, userId, message, messageType) {
        this.room = room;
        this.userId = userId;
        this.message = message;
        this.timestamp = new Date();
        this.messageType = messageType || ''; // chat/welcome/fairwell
    }
}

module.exports = Message;