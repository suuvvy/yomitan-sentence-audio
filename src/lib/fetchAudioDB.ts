import { StatusError } from 'itty-router';

export async function fetchAudioDB(source: string, file: string, env: Env): Promise<Blob> {
    const key = `${source}_files/${file}`;
    const R2Response = await env.yomitan_sentence_audio_r2_bucket.get(key);

    if (!R2Response) {
        throw new StatusError(404, 'File not found');
    }

    const mp3file = await R2Response.blob();

    return mp3file;
}