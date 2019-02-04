const request = require('request');

const authorizationHeader = {
    Authorization: `Token token=${process.env.MEGAPHONE_AUTH_TOKEN}`
}

module.exports = (externalId) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: authorizationHeader,
            json: true,
            method: 'GET',
            url: `https://cms.megaphone.fm/api/search/episodes?externalId=${externalId}`,
        }

        request(options, (error, response, body) => {
            if (error) reject(error)
            else if (body && body.length > 0) {
                const episode = body[0];
                resolve(episode);
            }
        });
    });
};
