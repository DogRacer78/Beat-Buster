// class to represent a guild, with its player and queue
const { EmbedBuilder, Message } = require("discord.js");
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

        // progress bar interval
        this.progressInterval;
        this.progressBarMsg;

        //this.voiceConnection.subscribe(player);

        player.addListener("stateChange", async (oldOne, newOne) => {
            console.log(newOne);
            console.log("State has changed");
            if (newOne == "idle" || newOne.status == "idle"){
                await this.playNextTrack();
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

        this.resetPlaying();

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
            console.log(videoData.playbackDuration);
            let youtubeVidData = await getDataOfTrack(nextTrack);
            this.playingDuration = youtubeVidData.durationInSec;
            this.playFile(videoData);
            console.log(`Now playing ${youtubeVidData.url}`);
            this.playing = youtubeVidData.url;
            this.timeStarted = Date.now();
            this.textChannel.send(`Now playing ${youtubeVidData.url}`);
            this.progressBarMsg = await this.textChannel.send("Getting Progress Bar...");
            console.log(this.progressBarMsg);
            this.progressInterval = setInterval(this.setProgressBar.bind(this), 1000);
            return;
        }
        else{
            console.log("Nothing to play, destroying connection");
            this.voiceConnection.destroy();
            this.voiceConnection = null;
            //console.log(this.voiceConnection);
            this.textChannel.send("Nothing to play");
        }
    }

    resetPlaying(){
        // reset some variables
        this.playing = "";
        this.playingDuration = 0;
        this.progressBarMsg = null;
        clearInterval(this.progressInterval);

    }

    setProgressBar(){
        if (this.progressBarMsg != null){
            let timeElapsed = (Date.now() - this.timeStarted) / 1000;
            let currentDuration = Math.floor(timeElapsed / this.playingDuration * 100);
            let durationDisplay = `[${'\u25A0'.repeat(currentDuration)}${'\u25A1'.repeat(100 - currentDuration)}] ${currentDuration}%`;
            //console.log(currentDuration);
            this.progressBarMsg.edit(durationDisplay);
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

            console.log(queueData);

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