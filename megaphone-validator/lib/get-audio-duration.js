const mm = require('music-metadata');
const request = require('request');

module.exports = (url) => {
    return new Promise((resolve, reject) => {
        request({ url, encoding: null }, (error, response, body) => {
            if (error) reject({ level: "ERROR", message: error });
            mm.parseBuffer(body, 'audio/mpeg', { duration: true })
                .then(metadata => resolve(metadata.format.duration))
                .catch(error => reject({ level: "ERROR", message: error }));
        });
    });
};
