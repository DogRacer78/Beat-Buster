// class to represent a guild, with its player and queue
const { EmbedBuilder, Message, ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder } = require("discord.js");
const { getVideoInfo, playData, getType, getDataOfTrack, createVoiceConnection } = require("./StreamData.js");
const { stream_from_info } = require("play-dl");
const { AudioPlayer, AudioPlayerStatus } = require("@discordjs/voice");

class GuildData {
    constructor(guildID, textChannel, player){
        this.guildID = guildID;
        /**@type {AudioPlayer} */
        this.player = player;
        this.voiceConnection = null;
        this.queue = [];
        this.textChannel = textChannel;
        this.playing = "";

        this.timeStarted;
        this.playingDuration = 0;
        this.playingMins = 0;
        this.playingSecs = 0;

        // progress bar interval
        this.progressInterval;
        this.progressBarMsg;

        this.buffer = false;

        // button refernces
        this.buttons = { row : null, message : null };

        //this.voiceConnection.subscribe(player);

        player.addListener("stateChange", (oldOne, newOne) => {
            console.log("State has changed");
            if (newOne == "idle" || newOne.status == "idle"){
                this.playNextTrack();
            }
        });
    }

    addToQueue(data){
        if (Array.isArray(data)){
            console.log("Adding playlist");
            for (let i = 0; i < data.length; i++){
                this.queue.push(data[i]);
                console.log(`Adding ${this.queue[i].name}`);
            }
        }
        else{
            console.log(data.url);
            this.queue.push(data);
        }


        
    }
    
    async playNextTrack(guildID, channelID, client){
        // play the next queue
        console.log(this.guildID);
        // play the next thing in the queue
        // send to chat saying so

        // if the bot is trying to play, it will be buffering
        // another should not be played if it is buffering
        if (this.buffer){
            console.log("BOT IS BUFFERING");
            return;
        }

        console.log("Not buffering, playing");

        this.buffer = true;

        this.resetPlaying();

        // reset the buttons if any exists
        this.disableCurrentButtons();

        let nextTrack = this.getNextTrack();
        if (nextTrack !== null){

            // set up the voice connection
            if (this.voiceConnection === null){
                this.voiceConnection = createVoiceConnection(guildID, channelID, client);
                this.voiceConnection.subscribe(this.player);
            }


            console.log(`Trying to play ${nextTrack.url}`);
            let videoData = await playData(nextTrack);
            console.log("Playback duration");
            let youtubeVidData = await getDataOfTrack(nextTrack);

            // playing duration calcs
            this.playingDuration = youtubeVidData.durationInSec;
            this.playingMins = Math.floor(this.playingDuration / 60);
            this.playingSecs = this.playingDuration % 60;

            this.playFile(videoData);
            this.timeStarted = Date.now();
            console.log(`Now playing ${youtubeVidData.url}`);
            this.playing = youtubeVidData.url;
            this.textChannel.send(`Now playing ${youtubeVidData.url}`);
            this.progressBarMsg = await this.textChannel.send("Getting Progress Bar...");
            this.progressInterval = setInterval(this.setProgressBar.bind(this), 1000);

            // send the playing button
            this.buttons.message = await this.textChannel.send({
                components : [this.currentPlayButtons()]
            });
        }
        else{
            console.log("Nothing to play, destroying connection");
            this.voiceConnection.destroy();
            this.voiceConnection = null;
            //console.log(this.voiceConnection);
            this.textChannel.send("Nothing to play");
        }
        this.buffer = false;
    }

    // for creating the currently playing buttons
    currentPlayButtons(){
        const pauseButton = new ButtonBuilder()
            .setCustomId("pause")
            .setLabel("\u23EF")
            .setStyle(ButtonStyle.Primary);

        const skipButton = new ButtonBuilder()
            .setCustomId("skip")
            .setLabel("\u23E9")
            .setStyle(ButtonStyle.Primary);

        const shuffleButton = new ButtonBuilder()
            .setCustomId("shuffle")
            .setLabel(String.fromCodePoint(0x1F500))
            .setStyle(ButtonStyle.Primary);

        const stopButton = new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("\u23F9")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents([pauseButton, stopButton, skipButton, shuffleButton]);

        this.buttons.row = row;

        return row;
    }

    // disbales the current buttons if any exist
    disableCurrentButtons(){
        if (this.buttons.row == null || this.buttons.message == null){
            return;
        }

        for (let i = 0; i < this.buttons.row.components.length; i++){
            if (this.buttons.row.components[i] != null)
                this.buttons.row.components[i].setDisabled(true);
        }

        this.buttons.message.edit({ components : [this.buttons.row] });

    }

    resetPlaying(){
        // reset some variables
        this.playing = "";
        this.playingDuration = 0;
        this.playingMins = 0;
        this.playingSecs = 0;
        this.timeStarted = 0;
        this.progressBarMsg = null;
        clearInterval(this.progressInterval);
    }

    setProgressBar(){
        if (this.progressBarMsg != null && this.player.state.status !== "paused"){
            let timeElapsed = (Date.now() - this.timeStarted) / 1000;
            let currentDuration = Math.floor(timeElapsed / this.playingDuration * 100);
            let timeElapsedMins = Math.floor(timeElapsed / 60);
            let timeElapsedSecs = Math.floor(timeElapsed % 60);
            let secsPadded = timeElapsedSecs.toString().padStart(2, "0");
            if (currentDuration >= 0 && currentDuration <= 100){
                let durationDisplay = `[${'\u25A0'.repeat(currentDuration)}${'\u25A1'.repeat(100 - currentDuration)}] - ${timeElapsedMins}:${secsPadded}/${this.playingMins}:${this.playingSecs.toString().padStart(2, '0')}`;
                //console.log(currentDuration);
                this.progressBarMsg.edit(durationDisplay);
            }
        }
        //this.progressBarMsg.edit(durationDisplay);
    }

    skipTrack(){
        if (this.peekNextTrack() === null){
            // if there is no next track stop the playback
            this.stopPlayback();
            this.resetPlaying();
        }
        else{
            this.playNextTrack();
        }
    }
    
    playFile (file) {
        // plays a file on the audio player
        this.player.play(file);
    }

    getNextTrack(){
        // return the next track in the queue
        if (this.queue.length !== 0){
            let nextTrack = this.queue.shift();
            return nextTrack;
        }
        else{
            return null;
        }
    }

    peekNextTrack(){
        if (this.queue.length !== 0){
            let nextTrack = this.queue[0];
            return nextTrack;
        }
        else{
            return null;
        }
    }

    clearQueue(){
        // return the next track in the queue
        if (this.queue.length !== 0){
            this.queue = [];
            return true;
        }
        else{
            return false;
        }
    }

    stopPlayback(){
        this.player.stop();
    }

    listQueue(){
        // return a string of the current queue
        if (this.queue.length !== 0){
            let queueData = [];
            for (let i = 0; i < this.queue.length; i++){
                let title = this.queue[i].title;
                let artist = this.queue[i].channel;
                if (title == undefined || artist == undefined){
                    title = this.queue[i].name;
                    artist = this.queue[i].artists[0].name;
                }
                queueData[i] = (i + 1) + ". " + title + " by " + artist + "\n";
            }

            let outputStrings = [""];
            let currentString = 0;
            for (let i = 0; i < queueData.length; i++){
                if (outputStrings[currentString].length + queueData[i].length < 2000){
                    outputStrings[currentString] += queueData[i];
                }
                else{
                    i--;
                    currentString++;
                    outputStrings[currentString] = "";
                }
            }

            return outputStrings;
        }
        else{
            return new EmbedBuilder()
                .setColor(0x1672db)
                .setTitle("Queue is empty");
        }
    }

    getEndQueue(){
        if (this.queue.length !== 0){
            let lastTrack = this.queue[this.queue.length - 1];
            return lastTrack;
        }
        else{
            return null;
        }
    }

    shuffleQueue(){
        if (this.queue.length !== 0){
            // shuffle the queue
            this.shuffleArray(this.queue);
        }
    }

    shuffleArray = array => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
    }

    pausePlayer(){
        this.player.pause();
    }

    resumePlayer(){
        if (this.player.state.status == "paused"){
            console.log("Thing is paused");
            this.player.unpause();
            return true;
        }
        else{
            return false;
        }
    }

    togglePlay(){
        if (this.player.state.status === "paused"){
            this.player.unpause();
            return "Resuming...";
        }
        else if (this.player.state.status === "playing"){
            this.player.pause();
            return "Pausing...";
        }
        else{
            return "Nothing Playing!!!";
        }
    }

    getPlaying(){
        // returns the song playing or nothing
        if (this.playing !== ""){
            // get the current time and subtract
            //console.log(this.progressBarMsg);
            return "Currently playing " + this.playing;
        }
        else{
            return "Nothing is Playing";
        }
    }

}

module.exports = GuildData;