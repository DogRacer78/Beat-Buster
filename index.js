const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require("@discordjs/voice");
const { video_basic_info, stream, search } = require("play-dl");

const VOICE_CHANNEL = "1012467820698796153";

let playerGuild = {};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    
    if (interaction.commandName === "play"){
        let data = interaction.options.getString("input");

        console.log(interaction.member.voice.channelId);
        console.log(interaction.member.guild.id);

        if (interaction.member.voice.channelId == null){
            console.log("Not in the correct server");
            await interaction.reply("You are not in a voice channel");
            return;
        }

        const voiceConnection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
	        guildId: interaction.member.guild.id,
	        adapterCreator: interaction.member.guild.voiceAdapterCreator
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


        // try and stream the yt video
        
        let vid;
        let outData;

        //temp rob code
        if (interaction.user.id == "435521829159829505"){
            data = "https://www.youtube.com/watch?v=GX8Hg6kWQYI";
        }


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

        const player = createAudioPlayer({
            behaviors : {
                noSubscriber : NoSubscriberBehavior.Play
            }
        });

        playerGuild[interaction.member.guild.id] = player;

        let file = createAudioResource(vid.stream, {inputType : vid.type});

        player.play(file);
        voiceConnection.subscribe(player);

        await interaction.reply(`Now Playing ${outData}`);
        console.log(`${interaction.user.tag} said ${outData}`);
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

client.login(data.token);