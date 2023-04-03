const {REST, Routes, SlashCommandBuilder} = require("discord.js");
const data = require("./config.json");

const command = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Will play a song")
    .addStringOption(option =>
        option.setName("input")
            .setDescription("This is the test input")
            .setRequired(true));

const stopCommand = new SlashCommandBuilder()
        .setName("stfu")
        .setDescription("STOPS JAMIES STUPUD VIDEOS");

const listCommand = new SlashCommandBuilder()
        .setName("list")
        .setDescription("Lists the current queue");

const skipCommand = new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips to the next track");

const shuffleCommand = new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffles the current queue");

const pauseCommand = new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pauses the current track");

const resumeCommand = new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the current track");

const playingCommand = new SlashCommandBuilder()
        .setName("playing")
        .setDescription("Gets the currently playing track");

const commands =
[
    command.toJSON(),
    stopCommand.toJSON(),
    listCommand.toJSON(),
    skipCommand.toJSON(),
    shuffleCommand.toJSON(),
    pauseCommand.toJSON(),
    resumeCommand.toJSON(),
    playingCommand.toJSON()
]

console.log(commands);

const rest = new REST({version : "10"}).setToken(data.token);

(async () => {
    try{
        console.log("Started refreshing application slash commands")

        //await rest.put(Routes.applicationCommands("1074068290290339931"), { body: [] });
        //await rest.put(Routes.applicationGuildCommands("1074068290290339931", "570276044079366145"), {body : []});
        console.log("Deleted all commands");

        await rest.put(Routes.applicationCommands(data.app_id), { body: commands });
        await rest.put(Routes.applicationGuildCommands(data.app_id, "570276044079366145"), {body : commands});
        await rest.put(Routes.applicationGuildCommands(data.app_id, "707252697887408278"), {body : commands});

        console.log("Successfully reloaded application slash commands");
    }
    catch (e){
        console.log("ERROR");
        console.log(e);
    }
})();