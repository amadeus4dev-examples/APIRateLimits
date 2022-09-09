export declare class Duration {
    #private;
    constructor(ms: number);
    get ms(): number;
    static FromMilliseconds(ms: number): Duration;
    static FromSeconds(seconds: number): Duration;
    static FromMinutes(minutes: number): Duration;
    static FromHours(hours: number): Duration;
    static FromDays(days: number): Duration;
    static FromMonths(months: number): Duration;
}
