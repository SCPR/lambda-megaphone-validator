const compareAudioFiles = require('./lib/compare-audio-files');

// Load environment variables
require('dotenv').config();

const programSlugString = process.env.SCPR_PROGRAM_SLUGS || '';

exports.handler = (event, context, callback) => {
    // Stops executing when the callback is fired.
    context.callbackWaitsForEmptyEventLoop = false;

    // Exit if there are no podcasts indicated in the env
    if (!programSlugString) {
        return false;
    }

    // Get each slug and check for today's episode
    const programSlugArray = programSlugString.split(',');
    const compareAllAudioFiles = programSlugArray.map((programSlug) => compareAudioFiles(programSlug));

    // After each pair of audio files have been compared, log the results or catch any errors
    Promise.all(compareAllAudioFiles)
        .then((results) => {
            const response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(results)
            }

            console.log(response);
            callback(null, response);
        })
        .catch((err) => {
            console.log({err});
            callback(err);
        })
};
