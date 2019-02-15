const request = require('request');

require('dotenv').config();

const authorizationHeader = {
    Authorization: `Token token=${process.env.MEGAPHONE_AUTH_TOKEN}`
}

module.exports = (megaphoneEpisode, audioUrl) => {
    return new Promise((resolve, reject) => {
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

        request(options, (error, response, body) => {
            if (error) reject({ level: "ERROR", message: error });
            resolve({ level: "REUPLOADED", message: `${programSlug}'s audio file was reuploaded`, body });
        });
    });
};
