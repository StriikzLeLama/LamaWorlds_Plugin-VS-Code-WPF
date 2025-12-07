/**
 * Debouncer utility for delaying function execution
 */
export class Debouncer {
    private _timeout: NodeJS.Timeout | null = null;

    constructor(private _delay: number = 300) {}

    debounce<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => void {
        return (...args: Parameters<T>) => {
            if (this._timeout) {
                clearTimeout(this._timeout);
            }
            this._timeout = setTimeout(() => {
                fn(...args);
                this._timeout = null;
            }, this._delay);
        };
    }

    cancel(): void {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}

