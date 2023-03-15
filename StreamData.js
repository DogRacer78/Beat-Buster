const { stream, search } = require("play-dl");
const { createAudioResource } = require("@discordjs/voice");

module.exports = async function playData(data){
    let vid;
    let outData;
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

    let file = createAudioResource(vid.stream, {inputType : vid.type});

    return { diplayTitle : outData, videoStream : file };
}