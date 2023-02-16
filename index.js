const { Client, GatewayIntentBits } = require("discord.js");
const ytdl = require("ytdl-core");
const client = new Client({intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});
const data = require("./config.json");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

const VOICE_CHANNEL = "1012467820698796153";
let stream;
let player;

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
        player = createAudioPlayer();

        stream = ytdl(data, {filter : "audioonly"});
        console.log("GOT THE FILE");

        let file = createAudioResource(stream);

        const sub = voiceConnection.subscribe(player);
        player.play(file);
        

        await interaction.reply(`You ran the command as ${interaction.user.tag} with option ${data}, user is in channel ${channel.name}`);
        console.log(`${interaction.user.tag} said ${data}`);
    }

    else if (interaction.commandName === "stfu"){
        player.stop();
        await interaction.reply("Fuck you bitch, I do what I want");
    }
});

client.login(data.token);