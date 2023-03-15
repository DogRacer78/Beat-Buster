// class to represent a guild, with its player and queue
const playData = require("./StreamData.js");

class GuildData {
    constructor(guildID, textChannel, player, voiceConnection){
        this.guildID = guildID;
        this.player = player;
        this.voiceConnection = voiceConnection;
        this.queue = [];
        this.voiceConnection.subscribe(player);
        player.addListener("stateChange", async (oldOne, newOne) => {
            console.log(newOne);
            console.log("State has changed");
            if (newOne == "idle" || newOne.status == "idle"){
                // play the next queue
                console.log(this.guildID);
                // play the next thing in the queue
                // send to chat saying so

                let nextTrack = this.getNextTrack();
                if (nextTrack !== null){
                    console.log(nextTrack);
                    let videoData = await playData(nextTrack);
                    this.playFile(videoData.videoStream);
                    console.log(`Now playing ${videoData.diplayTitle}`);
                    textChannel.send(`Now playing ${videoData.diplayTitle}`)
                }
                else{
                    console.log("Nothing to play");
                    textChannel.send("Nothing to play");
                }

            }
        });
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
}

module.exports = GuildData;