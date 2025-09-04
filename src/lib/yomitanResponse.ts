import { IRequest } from 'itty-router';
import type { AudioEntry } from './queryAudioDB';

export interface YomitanResponse {
    type: 'audioSourceList';
    audioSources: YomitanAudioSource[];
}

export interface YomitanAudioSource {
    name: string;
    url: string;
    sentence: string | null;
}

export async function generateYomitanResponseObject(
    entries: AudioEntry[],
    request: IRequest,
    env: Env
): Promise<YomitanResponse> {
    const audioSources = entries.map((entry) => {
        let audioUrl;
        const url = new URL(request.url);

        if (entry.file.includes('/')) {
            const parts = entry.file.split('/');
            const folder = encodeURIComponent(parts[0]);
            const file = encodeURIComponent(parts[1]);
            audioUrl = new URL(`/audio/get/${entry.source}/${folder}/${file}`, url.origin);
        } else {
            const file = encodeURIComponent(entry.file);
            audioUrl = new URL(`/audio/get/${entry.source}/${file}`, url.origin);
        }

        if (env.AUTHENTICATION_ENABLED) {
            audioUrl.searchParams.set('apiKey', request.apiKey);
        }

        return {
            name: entry.display,
            url: audioUrl.toString(),
            sentence: entry.sentence,
        };
    });

    return {
        type: 'audioSourceList',
        audioSources: [...audioSources],
    };
}
