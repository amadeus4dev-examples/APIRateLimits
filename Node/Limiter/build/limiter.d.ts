import { Duration } from './duration';
declare type AmadeusFunction = (p: any) => Promise<any>;
export declare class Limiter {
    #private;
    private constructor();
    static forTest(): Limiter;
    static forProduction(): Limiter;
    static custom(refresh: Duration, limit: number): Limiter;
    private getPermission;
    setGlobalLimits(globalRefresh: Duration, globalLimit: number): Limiter;
    wrap(fn: AmadeusFunction): Function;
}
export {};
