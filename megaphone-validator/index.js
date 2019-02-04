const getAudioDuration = require('./lib/get-audio-duration');
const request = require('request');
const request = require('./lib/reupload-audio');
const searchForMegaphoneEpisodes = require('./lib/search-megaphone');

// Load environment variables
require('dotenv').config();

const programSlugString = process.env.SCPR_PROGRAM_SLUGS || '';
const differenceThreshold = parseInt(process.env.DIFFERENCE_THRESHOLD) || 6;

exports.handler = (event, context, callback) => {
    // Exit if there are no podcasts indicated in the env
    if (!programSlugString) {
        return false;
    }

    // Get each slug and check for today's episode
    const programSlugArray = programSlugString.split(',');

    programSlugArray.forEach((programSlug) => {
        const todaysDate = new Date().toISOString().slice(0,10);
        const options = {
            json: true,
            method: 'GET',
            url: `https://scpr.org/api/v3/episodes?program=${programSlug}&air_date=${todaysDate}`,
        }

        request(options, async (error, response, body) => {
            if (error) throw error
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
                            reuploadAudio(megaphoneEpisode, originalAudio.url);
                        }
                    }
                }
            }
        });
    });
};
