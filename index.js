const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require("@discordjs/voice");
const { video_basic_info, stream, search } = require("play-dl");

const VOICE_CHANNEL = "1012467820698796153";
const player = createAudioPlayer({
    behaviors : {
        noSubscriber : NoSubscriberBehavior.Play
    }
});


client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    
    if (interaction.commandName === "play"){
        const data = interaction.options.getString("input");

        const channel = client.channels.cache.get(VOICE_CHANNEL);
        
        const voiceConnection = joinVoiceChannel({
            channelId: channel.id,
	        guildId: channel.guild.id,
	        adapterCreator: channel.guild.voiceAdapterCreator,
        });


        // try and stream the yt video
        let vid;
        let outData;
        try{
            vid = await stream(data, {discordPlayerCompatibility: true});
            console.log(`GOT ${data}`);
            outData = data;
        }
        catch(e){
            // if the URL can't be found locate it with a search
            outData = await search(data, {limit : 1});
            console.log(`Playing from ${outData[0].url}`);
            vid = await stream(outData[0].url, {discordPlayerCompatibility: true});
        }
        
        

        let file = createAudioResource(vid.stream, {inputType : vid.type});

        const sub = voiceConnection.subscribe(player);
        player.play(file);
        

        await interaction.reply(`Now Playing ${outData[0]}`);
        console.log(`${interaction.user.tag} said ${outData[0]}`);
    }

    else if (interaction.commandName === "stfu"){
        player.stop();
        await interaction.reply("Stopping");
    }
});

client.login(data.token);