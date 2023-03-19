const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const { video_basic_info, stream, search, setToken, spotify } = require("play-dl");
const GuildData = require("./GuildData");
const { getVideoInfo, getType, getSpotifyPlaylist, getSpotifyTrack, getYouTubeVideo, getSearch } = require("./StreamData.js");
const { TrackType } = require("./TrackTypeEnum");

let guildsRegistered = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;

     // check if the user is in the correct server
    if (interaction.member.voice.channelId == null){
        console.log("Not in the correct server");
        await interaction.reply("You are not in a voice channel");
        return;
    }
    
    if (interaction.commandName === "play"){

        let data = interaction.options.getString("input");
        let dataNoMod = data;

        let guildID = interaction.member.guild.id;
        let voiceChannelID = interaction.member.voice.channelId;
        let textChannel = interaction.channel;

        // check if the guild has been registered
        /** @type {GuildData} */
        let currentGuild = null;
        for (let i = 0; i < guildsRegistered.length; i++){
            if (guildsRegistered[i].guildID === guildID){
                // already registred
                currentGuild = guildsRegistered[i];
                //currentGuild.queue.push(data);
                console.log("The guild already exists");
                break;
            }
        }
        
        // if the guild does not exist then create a new object with a player
        if (currentGuild === null){
            // if not registered, register new player and
            const voiceConnection = createVoiceConnection(guildID, voiceChannelID);
            const player = createAudioPlayer({
                behaviors : {
                    noSubscriber : NoSubscriberBehavior.Play
                }
            });

            let newGuildData = new GuildData(guildID, textChannel, player, voiceConnection);
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
        else if (videoInfo === TrackType.YoutubeVideo){
            currentGuild.addToQueue(await getYouTubeVideo(data));
        }
        else if (videoInfo === TrackType.Search){
            currentGuild.addToQueue(await getSearch(data));
        }

        vidAdded = currentGuild.getEndQueue().url;

        playIfIdle(currentGuild);

        await interaction.reply(`Added ${vidAdded} to the queue`);

    }

    else if (interaction.commandName === "stfu"){
        // get the guild id
        let guildID = interaction.member.guild.id;
        // search for 
        const currentGuild = searchForGuild(guildID, guildsRegistered);
        if (currentGuild !== null){
            let res = currentGuild.clearQueue();
            currentGuild.stopPlayback();
            await interaction.reply("Stopping and clearing queue!");
        }
        else{
            await interaction.reply("Nothing is playing!");
        }
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
        // get the guild id
        let guildID = interaction.member.guild.id;
        const currentGuild = searchForGuild(guildID, guildsRegistered);
        if (currentGuild !== null){
            // if the current guild is not empty
            currentGuild.skipTrack();
            await interaction.reply("Skipping...");
        }
        else{
            await interaction.replied();
        }
    }
    else if (interaction.commandName === "shuffle"){
        // shuffle the queue
        let guildID = interaction.member.guild.id;
        const currentGuild = searchForGuild(guildID, guildsRegistered);
        if (currentGuild !== null){
            // if the current guild is not empty
            currentGuild.shuffleQueue();
            await interaction.reply("Shuffling...");
        }
        else{
            await interaction.replied();
        }
    }
});

function playIfIdle(currGuild){
    if (currGuild.player.state.status == "idle"){
        currGuild.player.emit("stateChange", AudioPlayerStatus.Idle, AudioPlayerStatus.Idle);
    }
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

function createVoiceConnection(guildID, channelId){
    const voiceConnection = joinVoiceChannel({
        channelId: channelId,
        guildId: guildID,
        adapterCreator: client.guilds.cache.get(guildID).voiceAdapterCreator
    });

    // bug in discord.js as of 11/03/23, this fixed from https://github.com/discordjs/discord.js/issues/9185
    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
      }
      
      voiceConnection.on('stateChange', (oldState, newState) => {
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');
      
        oldNetworking?.off('stateChange', networkStateChangeHandler);
        newNetworking?.on('stateChange', networkStateChangeHandler);
      });

    return voiceConnection;
}

(async () => {
    await setToken({spotify : {
        client_id : "a16e6d0fdea6485ba5849d461e92d593",
        client_secret : "63fb814586bc49719c4fe8b5edc3cde2",
        refresh_token : "AQDuUI5YUJK78WW23tgBPwJVsdAhEnNqT9G5uzGPVFEMcShai-FDhQP_kD43hJr9aL1vlnQBlUlYwarGT-ey9yXIroP6c4dX4Zglgk9pw5IxLoQbpWD2bQYfBvgYNrJEDWQ",
        market : "GB"
    }});
    client.login(data.token);
})();
