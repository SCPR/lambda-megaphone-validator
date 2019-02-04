const request = require('request');

const getAudioDuration = require('./get-audio-duration');
const reuploadAudio = require('./reupload-audio');
const searchForMegaphoneEpisodes = require('./search-megaphone');

require('dotenv').config();

const differenceThreshold = parseInt(process.env.DIFFERENCE_THRESHOLD) || 6;

module.exports = (programSlug) => {
    return new Promise((resolve, reject) => {
        const todaysDate = new Date().toISOString().slice(0,10);
        const options = {
            json: true,
            method: 'GET',
            url: `https://scpr.org/api/v3/episodes?program=${programSlug}&air_date=${todaysDate}`,
        }

        request(options, async (error, response, body) => {
            if (error) reject(error)
            if (body && body.episodes && body.episodes.length > 0) {
                const episode = body.episodes[0];
                const externalId = `${episode.id}__production`
                // If the most recent episode has at least one audio file, take it and then check if Megaphone has it
                if (episode.audio.length > 0) {
                    const originalAudio = episode.audio[0];
                    const megaphoneEpisode = await searchForMegaphoneEpisodes(externalId);

                    // If there is a megaphone episode
                    if (megaphoneEpisode) {
                        const originalAudioDuration = await getAudioDuration(originalAudio.url);
                        const megaphoneAudioStream = await getAudioDuration(megaphoneEpisode.downloadUrl);
                        const difference = Math.abs(megaphoneAudioStream - originalAudioDuration);

                        // If the difference is above the threshold, and an audio file isn't already being processed, then reupload
                        if (difference > differenceThreshold && megaphoneEpisode.audioFileProcessing === false) {
                            resolve(reuploadAudio(megaphoneEpisode, originalAudio.url));
                        } else {
                            resolve({ status: `${programSlug}'s audio file is within an expected range`});
                        }
                    } else {
                        resolve({ status: `${programSlug} doesn't have an equivalent megaphone episode yet`});
                    }
                } else {
                    resolve({ status: `${programSlug} doesn't have an an audio file attached yet`});
                }
            } else {
                resolve({ status: `${programSlug} doesn't have an episode published yet`});
            }
        });
    });
};
