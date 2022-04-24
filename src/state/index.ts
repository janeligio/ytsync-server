import ChatRoom from '../Models/ChatRoom';

/** Maps Room IDs to ChatRooms */
const YTsyncRooms = new Map<string, ChatRoom>(); // Map<RoomID, ChatRoom>

/** Maps SocketIDs to aliases */
const Aliases = new Map<string, string>(); // Map<SocketID, Alias>

export { YTsyncRooms, Aliases };
