import { AutoRouter, IRequest, json, error, createResponse } from 'itty-router';
import { unpack_term_reading, unpack_pitch, unpack_sources } from '../lib/queryUtils';
import { queryAudioDB, generateDisplayNames, sortResults } from '../lib/queryAudioDB';
import { generateYomitanResponseObject } from '../lib/yomitanResponse';
import { log } from '../lib/logger';
import { createTTSEntries } from '../lib/ttsUtils';
import { verifyApiKey } from '../lib/keyVerification';
import { fetchAudioTTS, fetchAudioDB as returnAudio, saveAudioTTS } from '../lib/fetchAudioDB';
import { generateTTSAudio } from '../lib/awsPolly';
import { withApiKey } from '../lib/middleware';

export const router = AutoRouter({ base: '/audio', catch: undefined });

router.get('/list', withApiKey, async (request: IRequest, env: Env) => {
    await verifyApiKey(request, env);

    log('info', 'audio_list', `Searching for audio with: ${request.url}`, request.query);

    const [term, reading] = await unpack_term_reading(request);

    const sources = await unpack_sources(request);

    const results = await queryAudioDB(term, reading, sources, env);

    log('info', 'db_result_count', `Searched for ${term} + ${reading} in ${sources} and got ${results.length} results`, {
        resultCount: results.length,
        term: term,
        reading: reading,
        sources: sources,
    });

    const displayNames = await generateDisplayNames(results, term, reading);

    const sortedResults = await sortResults(results, displayNames);

    const ttsEntries = await createTTSEntries(term, reading, sources, env, request);

    const yomitanResponses = await generateYomitanResponseObject(sortedResults, ttsEntries, request, env);

    return json(yomitanResponses, { status: 200 });
});

export const mp3 = createResponse('audio/mpeg');

router.get('/get/:source/:file', withApiKey, async (request: IRequest, env: Env) => {
    await verifyApiKey(request, env);

    const source = request.params.source;
    const file = decodeURIComponent(request.params.file);

    log('info', 'audio_get', `Fetching audio: ${source}/${file}`, { source, file });

    const audio = await returnAudio(source, file, env);
    return mp3(audio, { status: 200 });
});

router.get('/get/:source/:folder/:file', withApiKey, async (request: IRequest, env: Env) => {
    await verifyApiKey(request, env);

    const source = request.params.source;
    const file = decodeURIComponent(request.params.folder) + '/' + decodeURIComponent(request.params.file);

    log('info', 'audio_get', `Fetching audio: ${source}/${file}`, { source, file });

    const audio = await returnAudio(source, file, env);
    return mp3(audio, { status: 200 });
});

router.get('/tts', withApiKey, async (request: IRequest, env: Env, context: ExecutionContext) => {
    await verifyApiKey(request, env);

    const [term, reading] = await unpack_term_reading(request);
    const pitch = await unpack_pitch(request);

    const tts_identifier = encodeURIComponent(term + reading + pitch);

    const audio = await fetchAudioTTS(tts_identifier, env);

    if (audio !== null) {
        log('info', 'using_cached_tts', `Using cached TTS data: ${term}, ${reading}, ${pitch} `, {
            term: term,
            reading: reading,
            pitch: pitch,
        });
        return mp3(audio, { status: 200 });
    }

    const generatedAudio = await generateTTSAudio(term, reading, pitch, env);

    context.waitUntil(saveAudioTTS(tts_identifier, generatedAudio, env));

    return mp3(generatedAudio, { status: 200 });
});

router.all('*', () => {
    return error(400);
});
