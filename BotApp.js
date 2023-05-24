// holds data about the app
const GuildData = require('./GuildData');
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const { getVideoInfo, getType, getSpotifyPlaylist, getSpotifyTrack, getYouTubeVideo, getSearch, getSpotifyAlbum } = require("./StreamData.js");
const { TrackType } = require("./TrackTypeEnum");
const { TextChannel } = require('discord.js');

let guildsRegistered = [];


/**
 * 
 * @param {string} guildID 
 * @param {GuildData[]} guildDataObjs 
 */
function searchForGuild(guildID, guildDataObjs){
    for (let i = 0; i < guildDataObjs.length; i++){
        if (guildDataObjs[i].guildID === guildID){
            return guildDataObjs[i];
        }
    }
    return null;
}

/**
 * Searches for the guild by ID
 * @param {string} guildID 
 */
function searchGuildByID(guildID){
    return searchForGuild(guildID, guildsRegistered);
}

/**
 * 
 * @param {GuildData} currentGuild Guild
 */
function togglePlay(currentGuild){
    // using the current guild pause the current track
    if (currentGuild !== null){
        // if the current guild is not empty
        let res = currentGuild.togglePlay();
        //await interaction.reply(res);
        return res;
    }
    else{
        //await interaction.reply("Nothing is playing!");
        return "Nothing is playing!";
    }
}

/**
 * Stops the current playing song if there is one
 * @param {GuildData} currentGuild Guild
 */
function stop(currentGuild){
    if (currentGuild !== null){
        let res = currentGuild.clearQueue();
        currentGuild.stopPlayback();
        //await interaction.reply("Stopping and clearing queue!");
        return "Stopping and clearing queue!";
    }
    else{
        //await interaction.reply("Nothing is playing!");
        return "Nothing is playing!";
    }
}

function list(currentGuild){
    if (currentGuild !== null){
        // if the current guild is not empty
        let queueData = currentGuild.listQueue();
        if (Array.isArray(queueData)){
            (async (data, channel) => {
                console.log("Sending data");
                for (let i = 0; i < data.length; i++){
                    channel.send(data[i]);
                }
            })(queueData, currentGuild.textChannel);
            //await interaction.reply("Getting queue...");
            return "Getting queue...";
        }
        else{
            //await interaction.reply({embeds : [queueData]});
            return "Queue is empty!!!";    
        }
    }
    else{
        //await interaction.reply("Queue is empty");
        return "Queue is empty";
    }
}

/**
 * Skips to the next track
 * @param {GuildData} currentGuild Guild
 */
function skip(currentGuild){
    if (currentGuild !== null){
        // if the current guild is not empty
        currentGuild.skipTrack();
        //await interaction.reply("Skipping...");
        return "Skipping...";
    }
    else{
        //await interaction.replied();
        return "Nothing is playing!";
    }
}

/**
 * Shuffles the queue
 * @param {GuildData} currentGuild Guild
 */
function shuffle(currentGuild){
    if (currentGuild !== null){
        // if the current guild is not empty
        currentGuild.shuffleQueue();
        //await interaction.reply("Shuffling...");
        return "Shuffling...";
    }
    else{
        //await interaction.replied();
        return "Nothing is playing!";
    }
}

function playIfIdle(currGuild, guildID, channelID, client){
    console.log("Checking if idle...");
    if (currGuild.player.state.status == "idle"){
        console.log("Is Idle, trying to play again");
        currGuild.playNextTrack(guildID, channelID, client);
    }
    else{
        console.log("Is not idle");
    }

    console.log("Current status: " + currGuild.player.state.status);
}

function addGuild(guild){
    guildsRegistered.push(guild);
}


async function playTrack(currentGuild, guildID, textChannel, channelID, client, data){
    // if the guild does not exist then create a new object with a player
    if (currentGuild === null){
        // if not registered, register new player and
        //const voiceConnection = createVoiceConnection(guildID, voiceChannelID);
        const player = createAudioPlayer({
            behaviors : {
                noSubscriber : NoSubscriberBehavior.Play
            }
        });

        let newGuildData = new GuildData(guildID, textChannel, player);
        currentGuild = newGuildData;
        
        // add the guild to the list of guilds
        addGuild(currentGuild);

        console.log("Created a new guild instance");
    }

    //await interaction.deferReply();
    let videoInfo = await getType(data);
    let vidAdded;
    if (videoInfo === false){
        //await interaction.reply("Link is not supported");
        return "Link is not supported";
    }
    else if (videoInfo === TrackType.SpotifyPlaylist){
        // defer response and
        //await interaction.deferReply();
        console.log("Adding playlist to queue");
        const playListInfo = await getSpotifyPlaylist(data);
        currentGuild.addToQueue(playListInfo);
        playIfIdle(currentGuild, currentGuild.guildID, channelID, client);
        //await interaction.reply(`Added playlist ${data} to the queue!`);
        return `Added playlist ${data} to the queue!`;
    }
    else if (videoInfo === TrackType.SpotifyTrack){
        console.log("Is spotify and getting");
        currentGuild.addToQueue(await getSpotifyTrack(data));
    }
    else if (videoInfo === TrackType.SpotifyAlbum){
        console.log("Adding an album");
        currentGuild.addToQueue(await getSpotifyAlbum(data));
    }
    else if (videoInfo === TrackType.YoutubeVideo){
        currentGuild.addToQueue(await getYouTubeVideo(data));
    }
    else if (videoInfo === TrackType.Search){
        currentGuild.addToQueue(await getSearch(data));
    }

    vidAdded = currentGuild.getEndQueue().url;

    playIfIdle(currentGuild, currentGuild.guildID, channelID, client);
    //currentGuild.playNextTrack();

    //await interaction.reply(`Added ${vidAdded} to the queue`);
    return `Added ${vidAdded} to the queue`;
}

/**
 * Sends a message to a text channel
 * @param {TextChannel} textChannel 
 * @param {string} msg
 */
function sendMessage(textChannel, msg){
    if (textChannel !== null){
        textChannel.send(msg);
    }
}

exports.searchForGuild = searchForGuild;
exports.searchGuildByID = searchGuildByID;
exports.togglePlay = togglePlay;
exports.stop = stop;
exports.playTrack = playTrack;
exports.list = list;
exports.sendMessage = sendMessage;
exports.skip = skip;
exports.shuffle = shuffle;