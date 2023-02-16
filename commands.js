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

const commands =
[
    command.toJSON(),
    stopCommand.toJSON()
]

console.log(commands);

const rest = new REST({version : "10"}).setToken(data.token);

(async () => {
    try{
        console.log("Started refreshing application slash commands")

        await rest.put(Routes.applicationCommands("1074068290290339931"), { body: [] });
        await rest.put(Routes.applicationGuildCommands("1074068290290339931", "570276044079366145"), {body : []});
        console.log("Deleted all commands");

        await rest.put(Routes.applicationGuildCommands("1074068290290339931", "570276044079366145"), {body : commands});

        console.log("Successfully reloaded application slash commands");
    }
    catch (e){
        console.log("ERROR");
        console.log(e);
    }
})();