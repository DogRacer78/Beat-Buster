const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const { video_basic_info, stream, search, setToken, spotify, is_expired } = require("play-dl");
const GuildData = require("./GuildData");
const { getVideoInfo, getType, getSpotifyPlaylist, getSpotifyTrack, getYouTubeVideo, getSearch, getSpotifyAlbum } = require("./StreamData.js");
const { TrackType } = require("./TrackTypeEnum");

// logging
require("log-timestamp");

let guildsRegistered = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}, ${data.version}`);
});

client.on("interactionCreate", async (interaction) => {
    // check if the user is in the correct server
    if (interaction.member.voice.channelId == null){
        console.log("Not in the correct server");
        await interaction.reply("You are not in a voice channel");
        return;
    }

    // get the current guild
    let guildID = interaction.member.guild.id;
    let currentGuild = searchForGuild(guildID, guildsRegistered);

    if (interaction.isButton()){
        if (interaction.customId === "pause"){
            await togglePlay(currentGuild, interaction);
        }
        else if (interaction.customId === "stop"){
            await stop(currentGuild, interaction);
        }
        else if (interaction.customId === "skip"){
            await skip(currentGuild, interaction);
        }
        else if (interaction.customId === "shuffle"){
            await shuffle(currentGuild, interaction);
        }
    }
    else if (interaction.isChatInputCommand()){
        if (interaction.commandName === "play"){

            let data = interaction.options.getString("input");
    
            let voiceChannelID = interaction.member.voice.channelId;
            let textChannel = interaction.channel;
            
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
                // create class
                guildsRegistered.push(newGuildData);
                // add to object
                //playerGuild
                //currentGuild.queue.push(data);
    
                console.log("Created a new guild instance");
            }
    
            //await interaction.deferReply();
            let videoInfo = await getType(data);
            let vidAdded;
            if (videoInfo === false){
                await interaction.reply("Link is not supported");
                return;
            }
            else if (videoInfo === TrackType.SpotifyPlaylist){
                // defer response and
                //await interaction.deferReply();
                console.log("Adding playlist to queue");
                const playListInfo = await getSpotifyPlaylist(data);
                currentGuild.addToQueue(playListInfo);
                playIfIdle(currentGuild);
                await interaction.reply(`Added playlist ${data} to the queue!`);
                return;
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
    
            playIfIdle(currentGuild, guildID, voiceChannelID, client);
            //currentGuild.playNextTrack();
    
            await interaction.reply(`Added ${vidAdded} to the queue`);
    
        }
    
        else if (interaction.commandName === "stfu"){
            await stop(currentGuild, interaction);
        }
    
        else if (interaction.commandName === "list"){
            // get the guild id
            let guildID = interaction.member.guild.id;
            const currentGuild = searchForGuild(guildID, guildsRegistered);
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
                    await interaction.reply("Getting queue...");
                }
                else{
                    await interaction.reply({embeds : [queueData]});    
                }
            }
            else{
                await interaction.reply("Queue is empty");
            }
        }
        else if (interaction.commandName === "skip"){
            await skip(currentGuild, interaction);
        }
        else if (interaction.commandName === "shuffle"){
            await shuffle(currentGuild, interaction);
        }
        else if (interaction.commandName === "pause"){
            await togglePlay(currentGuild, interaction);
        }
        else if (interaction.commandName === "resume"){
            togglePlay(currentGuild, interaction);
        }
        else if (interaction.commandName === "playing"){
            //gets the currently playing song
            let guildID = interaction.member.guild.id;
            const currentGuild = searchForGuild(guildID, guildsRegistered);
            if (currentGuild !== null){
                // if the current guild is not empty
                // get the current song that is playing
                console.log("Something is playing");
                await interaction.reply(currentGuild.getPlaying());
                return;
            }
            await interaction.reply("Nothing is Playing");
        }
    }
    
    
});

/**
 * 
 * @param {GuildData} currentGuild Guild
 * @param {import("discord.js").Interaction} interaction Interaction Object
 */
async function togglePlay(currentGuild, interaction){
    // using the current guild pause the current track
    if (currentGuild !== null){
        // if the current guild is not empty
        let res = currentGuild.togglePlay();
        await interaction.reply(res);
    }
    else{
        await interaction.reply("Nothing is playing!");
    }
}

/**
 * Stops the current playing song if there is one
 * @param {GuildData} currentGuild Guild
 * @param {import("discord.js").Interaction} interaction Interaction Object
 */
async function stop(currentGuild, interaction){
    if (currentGuild !== null){
        let res = currentGuild.clearQueue();
        currentGuild.stopPlayback();
        await interaction.reply("Stopping and clearing queue!");
    }
    else{
        await interaction.reply("Nothing is playing!");
    }
}

/**
 * Skips to the next track
 * @param {GuildData} currentGuild Guild
 * @param {import("discord.js").Interaction} interaction Interaction Object
 */
async function skip(currentGuild, interaction){
    if (currentGuild !== null){
        // if the current guild is not empty
        currentGuild.skipTrack();
        await interaction.reply("Skipping...");
    }
    else{
        await interaction.replied();
    }
}

/**
 * Shuffles the queue
 * @param {GuildData} currentGuild Guild
 * @param {import("discord.js").Interaction} interaction Interaction Object
 */
async function shuffle(currentGuild, interaction){
    if (currentGuild !== null){
        // if the current guild is not empty
        currentGuild.shuffleQueue();
        await interaction.reply("Shuffling...");
    }
    else{
        await interaction.replied();
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

(async () => {
    await setToken({spotify : {
        client_id : data.spotClientId,
        client_secret : data.spotClientSecret,
        refresh_token : data.spotRefreshToken,
        market : data.spotMarket
    }});
    client.login(data.token);
})();
