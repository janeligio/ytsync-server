import express from 'express';
import axios from 'axios';

import { YTsyncRooms } from '../state';

const AppRouter = express.Router();

AppRouter.get('/', (req, res) => {
    res.json({ response: 'I am alive' });
});

AppRouter.get('/video/:videoId', (req, res) => {
    const { videoId } = req.params;
    const requestURL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.API_KEY}`;
    axios({
        method: 'get',
        url: requestURL,
    })
        .then((response) => {
            const { snippet } = response.data.items[0];
            const { title, thumbnails, channelTitle } = snippet;
            res.json({ title, thumbnails, channelTitle });
        })
        .catch((e) => console.log(e));
});

AppRouter.get('/room/:room', (req, res) => {
    const { room } = req.params;
    if (YTsyncRooms.has(room)) {
        const YTsyncRoom = YTsyncRooms.get(room);
        const currentTime = YTsyncRoom.getCurrentTime();
        const playerState = YTsyncRoom.getPlayerState();
        res.json({ currentTime, playerState });
    } else {
        res.json({ error: 'Room does not exist.' });
    }
});

export default AppRouter;
