const request = require('request');

const authorizationHeader = {
    Authorization: `Token token=${process.env.MEGAPHONE_AUTH_TOKEN}`
}

module.exports = (megaphoneEpisode, audioUrl) => {
    const episodeId = megaphoneEpisode.id;
    const networkId = process.env.MEGAPHONE_NETWORK_ID;
    const podcastId = megaphoneEpisode.podcastId;
    const options = {
        body: {
            backgroundAudioFileUrl: audioUrl
        },
        headers: authorizationHeader,
        json: true,
        method: 'PUT',
        url: `https://cms.megaphone.fm/api/networks/${networkId}/podcasts/${podcastId}/episodes/${episodeId}`,
    };

    request(options, (err, response, body) => {
        console.log(body);
        console.log(body.audioFileProcessing);
    });
};