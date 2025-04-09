import { IRequest, StatusError } from 'itty-router';
import { log } from './logger';
import { katakanaToHiragana } from './utils';

export function stripHtmlTags(input: string): string {
    input = input.replace(/<[^>]*>+/g, '');
    return input;
}

export function extractQueryParam(param: unknown): string | undefined {
    if (typeof param === 'undefined') {
        return undefined;
    }

    if (Array.isArray(param)) {
        return param.length > 0 ? String(param[0]) : '';
    }

    return String(param);
}

function extractQueryParamArray(param: unknown): string[] | undefined {
    if (typeof param === 'undefined') {
        return undefined;
    }

    if (Array.isArray(param)) {
        return param;
    }

    return String(param).split(',');
}

export async function unpack_term_reading(request: IRequest): Promise<[string, string]> {
    const query = request.query || {};

    const rawTerm = extractQueryParam(query.term);
    const rawReading = extractQueryParam(query.reading);

    if (rawTerm === undefined && rawReading === undefined) {
        throw new StatusError(400, 'Missing required parameters: term or reading');
    }

    const termWithoutHtml = rawTerm ? stripHtmlTags(rawTerm) : rawReading ? stripHtmlTags(rawReading) : '';
    const term = termWithoutHtml.trim();

    const readingWithoutHtml = rawReading && rawReading !== 'null' && rawReading !== 'undefined' ? stripHtmlTags(rawReading) : '';
    const reading = readingWithoutHtml.trim();

    if (term === '') {
        throw new StatusError(400, 'Empty parameters: term cannot be empty');
    }

    if (term.length > 120) {
        throw new StatusError(400, 'Term parameter is too long (max 120 characters)');
    }

    if (reading.length > 120) {
        throw new StatusError(400, 'Reading parameter is too long (max 120 characters)');
    }

    const hiraganaReading = katakanaToHiragana(reading);

    log('info', 'unpack_term_reading', `Unpacked term: "${term}" and reading: "${hiraganaReading}"`, {
        rawTerm: rawTerm,
        rawReading: rawReading,
        term: term,
        reading: hiraganaReading,
    });

    return [term, hiraganaReading];
}

const VALID_AUDIO_SOURCES = [
    'all',
    'nhk16',
    'daijisen',
    'shinmeikai8',
    'jpod',
    'taas',
    'ozk5',
    'forvo',
    'forvo_ext',
    'forvo_ext2',
    'tts',
] as const;

export type AudioSource = (typeof VALID_AUDIO_SOURCES)[number];

function isAudioSource(source: string): source is AudioSource {
    return VALID_AUDIO_SOURCES.includes(source as any);
}

export async function unpack_sources(request: IRequest): Promise<AudioSource[]> {
    const query = request.query || {};

    const rawSources = extractQueryParamArray(query.sources);

    if (rawSources === undefined) {
        return ['all'];
    }

    // Filter out invalid sources
    const validSources = rawSources.filter(isAudioSource);

    if (validSources.length === 0) {
        return ['all'];
    }

    log('info', 'unpack_sources', `Unpacked audio sources: ${validSources.join(', ')}`, {
        event: 'unpack_sources',
        rawSources: rawSources,
        validSources: validSources,
    });

    return validSources;
}

export async function unpack_pitch(request: IRequest): Promise<string> {
    const query = request.query || {};

    const rawPitch = extractQueryParam(query.pitch);

    if (rawPitch === undefined || rawPitch.length === 0) {
        return '';
    } else {
        return rawPitch;
    }
}
