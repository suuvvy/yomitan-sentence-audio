import { StatusError } from 'itty-router';

export async function fetchAudioDB(source: string, file: string, env: Env): Promise<Blob> {
    const key = `${source}_files/${file}`;
    const R2Response = await env.yomitan_audio_r2_bucket.get(key);

    if (!R2Response) {
        throw new StatusError(404, 'File not found');
    }

    const mp3file = await R2Response.blob();

    return mp3file;
}

export async function fetchAudioTTS(tts_identifier: string, env: Env): Promise<Blob | null> {
    const key = `tts_files/${tts_identifier}.mp3`;
    const object = await env.yomitan_audio_r2_bucket.get(key);

    if (!object) {
        return null;
    }

    const mp3file = await object.blob();

    return mp3file;
}

export async function saveAudioTTS(tts_identifier: string, mp3: Blob, env: Env): Promise<boolean> {
    const key = `tts_files/${tts_identifier}.mp3`;
    await env.yomitan_audio_r2_bucket.put(key, mp3);
    return true;
}
