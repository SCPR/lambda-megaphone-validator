const request = require('request');

const getAudioDuration = require('./get-audio-duration');
const reuploadAudio = require('./reupload-audio');
const searchForMegaphoneEpisodes = require('./search-megaphone');

require('dotenv').config();

const differenceThreshold = parseInt(process.env.DIFFERENCE_THRESHOLD) || 6;

module.exports = (programSlug) => {
    return new Promise((resolve, reject) => {
        const date = new Date();
        const utcDate = new Date(date.toUTCString());
        utcDate.setHours(utcDate.getHours()-8);
        const todaysDate = new Date(utcDate);
        const todaysDateString = todaysDate.toISOString().slice(0,10);

        const options = {
            json: true,
            method: 'GET',
            url: `https://scpr.org/api/v3/episodes?program=${programSlug}&air_date=${todaysDateString}`,
        }

        request(options, async (error, response, body) => {
            if (error) reject({ level: "ERROR", message: error })
            if (body && body.episodes && body.episodes.length > 0) {
                const episode = body.episodes[0];
                const externalId = `${episode.id}__production`
                // If the most recent episode has at least one audio file, take it and then check if Megaphone has it
                if (episode.audio.length > 0) {
                    const originalAudio = episode.audio[0];
                    const megaphoneEpisode = await searchForMegaphoneEpisodes(externalId);

                    // If there is a megaphone episode, check the difference in duration between both files
                    if (megaphoneEpisode) {
                        const originalAudioDuration = await getAudioDuration(originalAudio.url);
                        const megaphoneAudioStream = await getAudioDuration(megaphoneEpisode.audioFile);
                        const difference = Math.abs(megaphoneAudioStream - originalAudioDuration);

                        // If the difference is above the threshold, and an audio file isn't already being processed, then reupload
                        if (difference > differenceThreshold && megaphoneEpisode.audioFileProcessing === false) {
                            resolve(reuploadAudio(megaphoneEpisode, originalAudio.url));
                        // If an audio file is still being processed
                        } else if (megaphoneEpisode.audioFileProcessing) {
                            resolve({ level: "INFO", message: `${programSlug}'s audio file upload is still processing`});
                        // Otherwise, this audio file is probably within the expected range
                        } else {
                            resolve({ level: "INFO", message: `${programSlug}'s audio file is within an expected range`});
                        }
                    } else {
                        resolve({ level: "INFO", message: `${programSlug} doesn't have an equivalent megaphone episode yet`});
                    }
                } else {
                    resolve({ level: "INFO", message: `${programSlug} doesn't have an an audio file attached yet`});
                }
            } else {
                resolve({ level: "INFO", message: `${programSlug} doesn't have an episode published yet`});
            }
        });
    });
};
