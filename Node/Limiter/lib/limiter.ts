import Bottleneck from 'bottleneck';
import { Duration } from './duration';

const TEST_REFRESH: Duration = Duration.FromMilliseconds(400);
const PROD_REFRESH: Duration = Duration.FromMilliseconds(4000);
const TEST_LIMIT_FOR_PERIOD: number = 1;
const PROD_LIMIT_FOR_PERIOD: number = 40;
const TEST_MAX_CONCURRENT: number = 10;
const PROD_MAX_CONCURRENT: number = 40;
const DEFAULT_MAX_QUEUE: number = 100;
const GLOBAL_NOT_SET: Error = new Error('Global limits were not set but attempt to be used');


type AmadeusFunction = (p: any) => Promise<any>;

export class Limiter {
  #limiter: Bottleneck;
  #globalLimit: number;
  #globalRefresh: Duration | undefined;
  #remainingPermissions: number | undefined;
  #globalLimiterLastRefresh: number | undefined;

  private constructor(refresh: Duration, limit: number, maxConcurrent: number, maxQueue: number) {
    this.#limiter = new Bottleneck({
      maxConcurrent,
      reservoir: limit,
      reservoirRefreshInterval: refresh.ms,
      reservoirRefreshAmount: limit,
      highWater: maxQueue
    });
    this.#globalLimit = -1;
  }

  static forTest(): Limiter {
    return new Limiter(
      TEST_REFRESH,
      TEST_LIMIT_FOR_PERIOD,
      TEST_MAX_CONCURRENT,
      DEFAULT_MAX_QUEUE
    );
  }

  static forProduction(): Limiter {
    return new Limiter(
      PROD_REFRESH,
      PROD_LIMIT_FOR_PERIOD,
      PROD_MAX_CONCURRENT,
      DEFAULT_MAX_QUEUE
    );
  }

  static custom(refresh: Duration, limit: number): Limiter {
    return new Limiter(
      refresh,
      limit,
      TEST_MAX_CONCURRENT,
      DEFAULT_MAX_QUEUE
    );
  }

  private getPermission(): boolean {
    let allowed = false;
    if (this.#globalLimit > 0) {

      if (this.#globalLimiterLastRefresh === undefined || this.#globalRefresh === undefined
        || this.#remainingPermissions === undefined) throw GLOBAL_NOT_SET;
      

      if (Date.now() - this.#globalLimiterLastRefresh >= this.#globalRefresh.ms) {
        console.log('Refreshing global limiter')
        this.#remainingPermissions = this.#globalLimit;
        this.#globalLimiterLastRefresh = Date.now();
      }

      if (this.#remainingPermissions > 0) {
        allowed = true;
        this.#remainingPermissions--;
        console.log(`Permission acquired. Remaining: ${this.#remainingPermissions}. Time to refresh: ${this.#globalRefresh.ms - (Date.now() - this.#globalLimiterLastRefresh)}`)
      }
    } else allowed = true;
    return allowed;
  }

  setGlobalLimits(globalRefresh: Duration, globalLimit: number): Limiter {
    this.#globalRefresh = globalRefresh;
    this.#globalLimit = globalLimit;
    this.#globalLimiterLastRefresh = Date.now();
    this.#remainingPermissions = globalLimit;
    return this;
  }

  wrap(fn: AmadeusFunction): Function {
    return (params: any) => {
      if (this.getPermission()) return this.#limiter.schedule(() => fn(params));
      else throw new Error("Maximum global requests reached");
    }
  }
}