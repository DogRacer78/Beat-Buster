const { Client, GatewayIntentBits, resolveColor } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const { video_basic_info, stream, search, setToken, spotify, is_expired } = require("play-dl");
const GuildData = require("./GuildData");
const { getVideoInfo, getType, getSpotifyPlaylist, getSpotifyTrack, getYouTubeVideo, getSearch, getSpotifyAlbum } = require("./StreamData.js");
const { TrackType } = require("./TrackTypeEnum");
const { startAPI } = require("./Server.js");
const { searchForGuild, togglePlay, searchGuildByID, stop, playTrack, skip, shuffle, list } = require("./BotApp.js");

// logging
require("log-timestamp");



client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}, ${data.version}`);
    // start the api here
    startAPI();
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
    let currentGuild = searchGuildByID(guildID);

    if (interaction.isButton()){
        if (interaction.customId === "pause"){
            //await togglePlay(currentGuild, interaction);
            const res = togglePlay(currentGuild);
            await interaction.reply(res);
        }
        else if (interaction.customId === "stop"){
            await interaction.reply(stop(currentGuild));
        }
        else if (interaction.customId === "skip"){
            await interaction.reply(skip(currentGuild));
        }
        else if (interaction.customId === "shuffle"){
            await interaction.reply(shuffle(currentGuild));
        }
    }
    else if (interaction.isChatInputCommand()){
        if (interaction.commandName === "play"){

            let data = interaction.options.getString("input");
    
            let voiceChannelID = interaction.member.voice.channelId;
            let textChannel = interaction.channel;
            
            const res = await playTrack(currentGuild, guildID, textChannel, voiceChannelID, client.guilds.cache.get(guildID).voiceAdapterCreator, data);
            await interaction.reply(res);
    
        }
    
        else if (interaction.commandName === "stfu"){
            await interaction.reply(stop(currentGuild));
        }
    
        else if (interaction.commandName === "list"){
            await interaction.reply(list(currentGuild));
            
        }
        else if (interaction.commandName === "skip"){
            await interaction.reply(skip(currentGuild));
        }
        else if (interaction.commandName === "shuffle"){
            await interaction.reply(shuffle(currentGuild));
        }
        else if (interaction.commandName === "pause"){
            //await togglePlay(currentGuild, interaction);
            const res = togglePlay(currentGuild);
            await interaction.reply(res);
        }
        else if (interaction.commandName === "resume"){
            const res = togglePlay(currentGuild);
            await interaction.reply(res);
        }
        else if (interaction.commandName === "playing"){
            //gets the currently playing song
            let guildID = interaction.member.guild.id;
            const currentGuild = searchGuildByID(guildID);
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


(async () => {
    await setToken({spotify : {
        client_id : data.spotClientId,
        client_secret : data.spotClientSecret,
        refresh_token : data.spotRefreshToken,
        market : data.spotMarket
    }});
    await client.login(data.token);

    console.log("Logged in");
    console.log("Starting API...");
})();
