const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const { video_basic_info, stream, search } = require("play-dl");
const GuildData = require("./GuildData");

let playerGuild = {};
let guildsRegistered = [];

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    
    if (interaction.commandName === "play"){
        // check if the user is in the correct server
        if (interaction.member.voice.channelId == null){
            console.log("Not in the correct server");
            await interaction.reply("You are not in a voice channel");
            return;
        }

        let data = interaction.options.getString("input");
        let dataNoMod = data;

        let guildID = interaction.member.guild.id;
        let voiceChannelID = interaction.member.voice.channelId;
        let textChannel = interaction.channel;

        // check if the guild has been registered
        let currentGuild = null;
        for (let i = 0; i < guildsRegistered.length; i++){
            if (guildsRegistered[i].guildID === guildID){
                // already registred
                currentGuild = guildsRegistered[i];
                currentGuild.queue.push(data);
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
            currentGuild.queue.push(data);

            console.log("Created a new guild instance");
        }

        // add the data to the queue
        console.log(currentGuild.player.state.status);
        if (currentGuild.player.state.status == "idle"){
            currentGuild.player.emit("stateChange", AudioPlayerStatus.Idle, AudioPlayerStatus.Idle);
        }
        await interaction.reply(`Added to the queue`);


        // try and stream the yt video
        
        /*
        let vid;
        let outData;

        let robSongs = ["https://www.youtube.com/watch?v=EK_LN3XEcnw&ab_channel=LouBegaVEVO", "https://www.youtube.com/watch?v=gtOV7bp-gys&ab_channel=robbiewilliamsvevo",
        "https://www.youtube.com/watch?v=b9Y4TACmvE8&ab_channel=JamiroquaiVEVO", "https://www.youtube.com/watch?v=92cwKCU8Z5c&ab_channel=AbbaVEVO", 
        "https://youtu.be/Q-jqcZ_Jbd8", "https://www.youtube.com/watch?v=oftolPu9qp4", "https://www.youtube.com/watch?v=NTfZshkNZRw"];

        //temp rob code
        //if (interaction.user.id == "435520930861809664"){
            //let songChosen = Math.floor(Math.random() * (robSongs.length - 1));
            //console.log(songChosen);
            //data = robSongs[songChosen];
        //}


        try{
            vid = await stream(data, {discordPlayerCompatibility : true});
            console.log(`GOT ${data}`);
            outData = data;
        }
        catch(e){
            // if the URL can't be found locate it with a search
            console.log(`Searching for ${data}`);
            outData = await search(data, {limit : 1});
            console.log(`Playing from ${outData[0].url}`);
            vid = await stream(outData[0].url, {discordPlayerCompatibility : true});
        }

        //if (interaction.user.id == "435520930861809664"){
            //outData = dataNoMod;
        //}

        playerGuild[interaction.member.guild.id] = player;

        let file = createAudioResource(vid.stream, {inputType : vid.type});

        player.play(file);
        voiceConnection.subscribe(player);

        await interaction.reply(`Now Playing ${outData}`);
        console.log(`${interaction.user.tag} said ${outData}`);
        */
    }

    else if (interaction.commandName === "stfu"){
        console.log(playerGuild[interaction.member.guild.id]);

        if (playerGuild[interaction.member.guild.id] == null){
            await interaction.reply("Nothing is playing");
            return;
        } 
        playerGuild[interaction.member.guild.id].stop();
        delete playerGuild[interaction.member.guild.id];
        await interaction.reply("Stopping");
    }
});

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

client.login(data.token);