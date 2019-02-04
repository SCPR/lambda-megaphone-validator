const mm = require('music-metadata');
const request = require('request');

module.exports = (url) => {
    return new Promise((resolve, reject) => {
        request({ url, encoding: null }, (err, response, body) => {
            if (err) reject(err);
            mm.parseBuffer(body, 'audio/mpeg', { duration: true })
                .then(metadata => resolve(metadata.format.duration))
                .catch(err => reject(err));
        });
    });
};
