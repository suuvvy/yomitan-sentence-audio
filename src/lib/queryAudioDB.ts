import { StatusError } from 'itty-router';
import { katakanaToHiragana } from './utils';

import type { AudioSource } from './queryUtils';
import { log } from './logger';

export interface AudioEntry {
    expression: string;
    reading: string;
    source: string;
    file: string;
    display: string;
    sentence: string | null;
}

export async function queryAudioDB(term: string, reading: string, sources: AudioSource[], env: Env): Promise<AudioEntry[]> {
    let baseCondition = 'WHERE expression = ?';
    const params: any[] = [term];

    if (reading && reading.trim() !== '') {
        baseCondition = `WHERE (expression = ? OR reading = ?)`;
        const convertedReading = katakanaToHiragana(reading);
        params.push(convertedReading);
    }

    if (sources.length > 0 && !sources.includes('all')) {
        const placeholders = sources.map(() => '?').join(', ');
        baseCondition += ` AND source IN (${placeholders})`;
        params.push(...sources);
    }

    const query = `SELECT expression, reading, source, file, display FROM entries ${baseCondition}`;

    let d1results: D1Result = await env.yomitan_sentence_audio_d1_db
        .prepare(query)
        .bind(...params)
        .all();

    if (d1results.success) {
        return d1results.results as AudioEntry[];
    } else {
        log('error', 'query_pitch_db_failed', `Database query failed for term: ${term}, reading: ${reading}`, { term: term, reading: reading, d1_result: d1results.error || 'Unknown Error' });
        throw new StatusError(500, 'Database query failed');
    }
}

export async function generateDisplayNames(entries: AudioEntry[], term: string, reading: string): Promise<string[]> {
    let names: string[] = [];
    entries.forEach((entry) => {
        let name = `${entry.source}`;
        if (entry.display) {
            name += `: ${entry.display}`;
        }

        if (term == entry.expression && reading == entry.reading) {
            name += ` (E+R)`;
        } else if (term == entry.expression) {
            name += ` (E)`;
        } else if (reading == entry.reading) {
            name += ` (R)`;
        }

        names.push(name);
    });

    return names;
}

export async function sortResults(entries: AudioEntry[], names: string[]): Promise<AudioEntry[]> {
    const sourcePriority: { [key: string]: number } = {
        core: 0,
        alt: 1
    };

    const getMatchTypePriority = (name?: string): number => {
        if (!name) return 3;
        if (name.includes('(E+R)')) return 0;
        if (name.includes('(E)')) return 1;
        if (name.includes('(R)')) return 2;
        return 3;
    };

    const result = entries.map((entry, index) => {
        const copy = { ...entry };

        if (index < names.length) {
            copy.sentence = copy.display;
            copy.display = names[index];
        } else {
            copy.display = undefined as unknown as string;
        }

        return copy;
    });

    result.sort((a, b) => {
        const aMatchPriority = getMatchTypePriority(a.display);
        const bMatchPriority = getMatchTypePriority(b.display);

        if (aMatchPriority !== bMatchPriority) {
            return aMatchPriority - bMatchPriority;
        }

        const aPriority = sourcePriority[a.source] ?? Number.MAX_SAFE_INTEGER;
        const bPriority = sourcePriority[b.source] ?? Number.MAX_SAFE_INTEGER;
        return aPriority - bPriority;
    });

    return result;
}
