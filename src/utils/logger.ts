import { DebugConsole } from '../services/DebugConsole';

/**
 * Logger utility - Wrapper around DebugConsole for easier usage
 */
export class Logger {
    private _category: string;

    constructor(category: string) {
        this._category = category;
    }

    public info(message: string, context?: any): void {
        DebugConsole.getInstance().info(message, this._category, context);
    }

    public warn(message: string, context?: any): void {
        DebugConsole.getInstance().warn(message, this._category, context);
    }

    public error(message: string, error?: any, context?: any): void {
        DebugConsole.getInstance().error(message, error, this._category, context);
    }

    public debug(message: string, context?: any): void {
        DebugConsole.getInstance().debug(message, this._category, context);
    }

    public trace(message: string, context?: any): void {
        DebugConsole.getInstance().trace(message, this._category, context);
    }

    public time(label: string): () => void {
        return DebugConsole.getInstance().time(label, this._category);
    }
}

/**
 * Create a logger instance for a specific category
 */
export function createLogger(category: string): Logger {
    return new Logger(category);
}

