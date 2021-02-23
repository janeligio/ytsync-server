const Events = {
    assign_id: 'assign id', // params: id | Server: I'm assigning you an id.
    join_room: 'join room', // params: room, id, callback | Client: I want to join a room.
    send_message: 'send message', // params: room, id, text | Client: I want to send a message.
    receive_message: 'receive message', // params: message | Server: You will receive a message.
    receive_all_messages: 'receive all messages', // params: messages[] | Server: You will receive all messages of a chatroom.
    typing: 'typing', // params: room, id | Client: I am typing
}

module.exports = Events;