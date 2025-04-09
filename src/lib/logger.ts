import { error, IRequest, StatusError } from 'itty-router';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
    truncateArrays?: number; // Max number of items to include from arrays
    maxDepth?: number; // Max object nesting to serialize
}

export function log(level: LogLevel, event: string, message: string, data?: any, options: LogOptions = {}) {
    const { truncateArrays = 10, maxDepth = 2 } = options;

    const preparedData = data ? prepareForLogging(data, truncateArrays, maxDepth, 0) : undefined;

    const logObject = {
        message,
        level,
        event,
        ...(preparedData ? { data: preparedData } : {}),
        timestamp: new Date().toISOString(),
    };

    console[level](JSON.stringify(logObject));
}

function prepareForLogging(obj: any, maxArrayItems: number, maxDepth: number, currentDepth: number): any {
    if (obj === null) return null;
    if (obj === undefined) return undefined;
    
    // Handle non-serializable or special types
    if (typeof obj === 'function') return '[Function]';
    if (typeof obj === 'symbol') return '[Symbol]';
    if (obj instanceof Error) {
        return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack
        };
    }
    
    if (currentDepth > maxDepth) return '[Object]';

    if (Array.isArray(obj)) {
        if (obj.length > maxArrayItems) {
            return [...obj.slice(0, maxArrayItems), `[...${obj.length - maxArrayItems} more items]`];
        }
        return obj.map((item) => prepareForLogging(item, maxArrayItems, maxDepth, currentDepth + 1));
    }

    if (obj && typeof obj === 'object') {
        try {
            return Object.fromEntries(
                Object.entries(obj).map(([key, val]) => [key, prepareForLogging(val, maxArrayItems, maxDepth, currentDepth + 1)])
            );
        } catch (e) {
            return '[Unserializable Object]';
        }
    }

    return obj;
}

export const errorHandler = (err: Error, request: IRequest) => {
    if (err instanceof StatusError) {
        return error(err.status, { message: err.message });
    }

    log('error', 'unhandled_error', `Unhandled error: ${err.message}`, {
        url: request.url,
        method: request.method,
        error: err.message,
        stack: err.stack,
    });

    return error(500, { message: 'Internal Server Error' });
};
