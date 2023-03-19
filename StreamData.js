const { stream, search, yt_validate, video_info, stream_from_info, sp_validate, spotify, SpotifyTrack, YouTubeVideo } = require("play-dl");
const { createAudioResource } = require("@discordjs/voice");
const { TrackType } = require("./TrackTypeEnum.js");

exports.playData = async function playData(track){

    /*
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
    */

    // stream from the track
    let data = await getDataOfTrack(track);
    data = data.url;
    console.log(data);

    let videoStream = await stream(data, { discordPlayerCompatibility : true});
    let file = createAudioResource(videoStream.stream, {inputType : videoStream.type});

    return file;
}

async function getDataOfTrack(track){
    let videoInfo = await getType(track);
    console.log(videoInfo);
    if (videoInfo === false){
        // do nothing for now
        return false;
    }
    else if (videoInfo === TrackType.SpotifyTrack){
        const youtubeSpot = await search(track.name + track.artists[0].name, { limit : 1});
        return youtubeSpot[0];
    }
    else if (videoInfo === TrackType.YoutubeVideo){
        return track;
    }
    else if (videoInfo === TrackType.Search){
        const youtubeVid = await search(track, { limit : 1});
        return youtubeVid[0];
    }
}

/**
 * takes a url or a search term and returns a video info object
 * @param {String} data URL or search term 
 */
exports.getVideoInfo = async function getVideoInfo(data){
    // check is youtube link
    let spotifyLink = sp_validate(data);

    if (spotifyLink === "track"){
        // is a spotify link
        const track = await spotify(data);
        const video = await search(track.name, { limit : 1 });
        return await video_info(video[0].url);
    }
    else if (spotifyLink !== "search" && spotifyLink !== false){
        console.log(spotifyLink);
        console.log("Is a non supported spotify link");
        return false;
    }

    else if (data.startsWith("https") && yt_validate(data) === "video"){
        // it is a URL
        return await video_info(data);
    }
    else{
        const video = await search(data, { limit : 1});
        return await video_info(video[0].url);
    }
}

// gets the type and returns as an enum
async function getType(data){
    if (typeof data != "string"){
        data = data.url;
    }

    // check is youtube link
    let spotifyLink = sp_validate(data);

    if (spotifyLink === "track"){
        // is a spotify link
        return TrackType.SpotifyTrack;
    }
    else if (spotifyLink === "playlist"){
        return TrackType.SpotifyPlaylist;
    }
    else if (spotifyLink !== "search" && spotifyLink !== false){
        return false;
    }

    else if (data.startsWith("https") && yt_validate(data) === "video"){
        // it is a URL
        //return await video_info(data);
        return TrackType.YoutubeVideo;
    }
    else{
        //const video = await search(data, { limit : 1});
        //return await video_info(video[0].url);
        return TrackType.Search;
    }
}

exports.getSpotifyPlaylist = async function getSpotifyPlaylist(url){
    // get the playlist
    const playlist = await spotify(url);
    let videoInfoTracks = [];
    const allTracks = await playlist.all_tracks();
    return allTracks;
}

exports.getSpotifyTrack = async function getSpotifyTrack(url){
    const track = await spotify(url);
    return track;
}

exports.getYouTubeVideo = async function getYoutubeVideo(url){
    return (await video_info(url)).video_details;
}

exports.getSearch = async function getSearch(searchTerm){
    const video = await search(searchTerm, { limit : 1});
    return video[0];
}

exports.getType = getType;
exports.getDataOfTrack = getDataOfTrack;