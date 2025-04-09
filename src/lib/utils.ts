/**
 * Character mappings for converting between katakana and hiragana
 */
const KATAKANA_CHART =
    'ァアィイゥウェエォオカガカ゚キギキ゚クグク゚ケゲケ゚コゴコ゚サザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヽヾ';
const HIRAGANA_CHART =
    'ぁあぃいぅうぇえぉおかがか゚きぎき゚くぐく゚けげけ゚こごこ゚さざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖゝゞ';

export function katakanaToHiragana(text: string): string {
    if (!text) return '';

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = KATAKANA_CHART.indexOf(char);
        if (index >= 0) {
            result += HIRAGANA_CHART[index];
        } else {
            result += char;
        }
    }

    return result;
}

export function hiraganaToKatakana(text: string): string {
    if (!text) return '';

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = HIRAGANA_CHART.indexOf(char);
        if (index >= 0) {
            result += KATAKANA_CHART[index];
        } else {
            result += char;
        }
    }

    return result;
}

async function generateVariantsFromChars(chars: string[], index: number): Promise<string[]> {
    if (index >= chars.length) {
        return [''];
    }

    const results: string[] = [];
    const current = chars[index];

    // Check for special patterns
    if (index < chars.length - 1) {
        // Handle おお→おー pattern (and other double vowels)
        if (current === 'オ' && chars[index + 1] === 'オ') {
            // Always replace おお with おー
            const remainingVariants = await generateVariantsFromChars(chars, index + 2);
            for (const suffix of remainingVariants) {
                results.push('オー' + suffix);
            }
            return results;
        }

        // Handle おう→おー/おう pattern (generate both variants)
        if (
            chars[index + 1] === 'ウ' &&
            (current === 'オ' ||
                current === 'コ' ||
                current === 'ソ' ||
                current === 'ト' ||
                current === 'ノ' ||
                current === 'ホ' ||
                current === 'モ' ||
                current === 'ロ' ||
                current === 'ゴ' ||
                current === 'ゾ' ||
                current === 'ド' ||
                current === 'ボ' ||
                current === 'ポ' ||
                current === 'ヨ' ||
                current === 'ショ' ||
                current === 'チョ' ||
                current === 'ジョ')
        ) {
            // Generate both variants: おう and おー
            const remainingVariants = await generateVariantsFromChars(chars, index + 2);
            for (const suffix of remainingVariants) {
                results.push(current + 'ウ' + suffix); // Keep as おう
                results.push(current + 'ー' + suffix); // Convert to おー
            }
            return results;
        }

        // Handle えい→えー pattern
        if (
            chars[index + 1] === 'イ' &&
            (current === 'エ' ||
                current === 'ケ' ||
                current === 'セ' ||
                current === 'テ' ||
                current === 'ネ' ||
                current === 'ヘ' ||
                current === 'メ' ||
                current === 'レ' ||
                current === 'ゲ' ||
                current === 'ゼ' ||
                current === 'デ' ||
                current === 'ベ' ||
                current === 'ペ')
        ) {
            // Always replace えい with えー
            const remainingVariants = await generateVariantsFromChars(chars, index + 2);
            for (const suffix of remainingVariants) {
                results.push(current + 'ー' + suffix);
            }
            return results;
        }
    }

    // Check if the current character is a candidate vowel extension.
    if (current === 'ウ' && index > 0) {
        // The base two options: keep as is, or replace with long-vowel mark.
        const options = ['ウ', 'ー'];

        // For each variant option at this position, combine with the variants from the remainder of the string.
        for (const option of options) {
            for (const suffix of await generateVariantsFromChars(chars, index + 1)) {
                results.push(option + suffix);
            }
        }
    } else {
        // For non-candidate characters, just append the current character.
        for (const suffix of await generateVariantsFromChars(chars, index + 1)) {
            results.push(current + suffix);
        }
    }

    return results;
}
export function isKana(text: string): boolean {
    if (!text) return false;
    // Regular expression for hiragana and katakana ranges
    const kanaRegex = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
    return kanaRegex.test(text);
}

export async function generatePronunciationVariants(input: string): Promise<string[]> {
    // Return empty array for inputs longer than 12 characters to prevent performance issues
    if (!isKana(input)) {
        return [];
    }

    if (input.length > 12) {
        return [];
    }

    const katakana = hiraganaToKatakana(input);
    const chars = [...katakana];

    // Generate base variants (handling ウ/ー replacements)
    const baseVariants = await generateVariantsFromChars(chars, 0);
    const finalVariants: string[] = [];

    // For each base variant, generate pitch accent positions
    for (const variant of baseVariants) {
        // Add the base variant (no pitch drop)
        finalVariants.push(variant);

        // Add variants with pitch drops at valid positions
        const variantChars = [...variant];
        for (let i = 0; i < variantChars.length - 1; i++) {
            const pitchVariant = variantChars.slice(0, i + 1).join('') + "'" + variantChars.slice(i + 1).join('');
            finalVariants.push(pitchVariant);
        }
    }

    return finalVariants;
}

export const redirect = (url: string, status = 302) => {
    return new Response(null, {
        status,
        headers: { Location: url },
    });
};
