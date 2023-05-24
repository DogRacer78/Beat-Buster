// an express API server
const express = require('express');
const app = express();
const { searchGuildByID, togglePlay, sendMessage, stop, list, skip } = require('./BotApp');

app.use(express.json());

// pause endpoint
// 
app.post('/pause', (req, res) => {
    const id = req.body.id;

    if (!id){
        res.status(400).send("No id provided");
        return;
    }

    // search for the guild
    const guild = searchGuildByID(id);
    if (guild === null){
        // send bad request
        res.status(400).send(`Guild ${id} not found`);
        return;
    }


    //pause the guild
    const playRes = togglePlay(guild);

    // send a message on the server to show that the song is paused
    sendMessage(guild.textChannel, playRes);

    res.status(200).send(`Paused and recieved ${playRes}`);
});

// stop endpoint
app.post('/stop', (req, res) => {
    const id = req.body.id;

    if (!id){
        res.status(400).send("No id provided");
        return;
    }

    const guild = searchGuildByID(id);
    if (guild === null){
        res.status(400).send(`Guild ${id} not found`);
        return;
    }

    // stop the guild
    const stopRes = stop(guild);
    sendMessage(guild.textChannel, stopRes);
    res.status(200).send(`Stopped and recieved ${stopRes}`);


});

// list endpoint
app.post("/list", (req, res) => {
    const id = req.body.id;

    if (!id){
        res.status(400).send("No id provided");
        return;
    }

    const guild = searchGuildByID(id);
    if (guild === null){
        res.status(400).send(`Guild ${id} not found`);
        return;
    }

    const listRes = list(guild);
    sendMessage(guild.textChannel, listRes);
    res.status(200).send(`Listed and recieved ${listRes}`);

});

// skip endpoint
app.post("/skip", (req, res) => {
    const id = req.body.id;

    if (!id){
        res.status(400).send("No id provided");
        return;
    }

    const guild = searchGuildByID(id);
    if (guild === null){
        res.status(400).send(`Guild ${id} not found`);
        return;
    }

    const skipRes = skip(guild);
    sendMessage(guild.textChannel, skipRes);
    res.status(200).send(`Skipped and recieved ${skipRes}`);

});

function startAPI() {
    app.listen(80, () => {
        console.log('Server is running on port 80');
    });
}

exports.startAPI = startAPI;