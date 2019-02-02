const mm = require('music-metadata');
const request = require('request');

// Load environment variables
require('dotenv').config();

const authorizationHeader = {
    Authorization: `Token token=${process.env.MEGAPHONE_AUTH_TOKEN}`
}
const programSlugString = process.env.SCPR_PROGRAM_SLUGS || '';
const differenceThreshold = parseInt(process.env.DIFFERENCE_THRESHOLD) || 6;

const searchForMegaphoneEpisodes = (externalId) => {
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
}

const getAudioDuration = (url) => {
    return new Promise((resolve, reject) => {
        request({ url, encoding: null }, (err, response, body) => {
            mm.parseBuffer(body, 'audio/mpeg', { duration: true })
                .then(metadata => resolve(metadata.format.duration))
                .catch(err => reject(err));
        });
    });
}

const reuploadAudio = (megaphoneEpisode, audioUrl) => {
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
}

const getLatestEpisodes = () => {
    // Exit if there are no podcasts indicated
    if (!programSlugString) {
        return false;
    }

    const programSlugArray = programSlugString.split(',');

    programSlugArray.forEach((programSlug) => {
        // const todaysDate = new Date().toISOString().slice(0,10);
        const todaysDate = "2019-01-25"
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
                if (episode.audio.length > 0) {
                    const originalAudio = episode.audio[0];
                    const megaphoneEpisode = await searchForMegaphoneEpisodes(externalId);
                    const originalAudioDuration = await getAudioDuration(originalAudio.url);
                    const megaphoneAudioStream = await getAudioDuration(megaphoneEpisode.downloadUrl);
                    const difference = Math.abs(megaphoneAudioStream - originalAudioDuration);
                    console.log({ originalAudio: originalAudio.url, megaphoneAudio: megaphoneEpisode.downloadUrl, difference });

                    // If the difference is above the threshold, reupload
                    if (difference > differenceThreshold) {
                        reuploadAudio(megaphoneEpisode, originalAudio.url);
                    }
                }
            }
        });
    });

}

getLatestEpisodes();

