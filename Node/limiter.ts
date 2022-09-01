import Bottleneck from 'bottleneck';

const TEST_REFRESH: Duration = Duration.FromMilliseconds(400);
const PROD_REFRESH: Duration = Duration.FromMilliseconds(4000);
const TEST_LIMIT_FOR_PERIOD: number = 1;
const PROD_LIMIT_FOR_PERIOD: number = 40;
const TEST_MAX_CONCURRENT: number = 10;
const PROD_MAX_CONCURRENT: number = 40;
const DEFAULT_MAX_QUEUE: number = 100;

type AmadeusFunction = (p: any) => Promise<any>;

class Limiter {
  #limiter: Bottleneck;
  #globalLimit: number;
  #globalRefresh: Duration;
  #remainingPermissions: number;
  #globalLimiterLastRefresh: Date;

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
      if (Date.now() - this.#globalLimiterLastRefresh.getTime() >= this.#globalRefresh.ms) {
        this.#remainingPermissions = this.#globalLimit;
      }

      if (this.#remainingPermissions > 0) {
        allowed = true;
        this.#remainingPermissions--;
      }
    }
    return allowed;
  }

  setGlobalLimits(globalRefresh: Duration, globalLimit: number): Limiter {
    this.#globalRefresh = globalRefresh;
    this.#globalLimit = globalLimit;
    return this;
  }

  wrap(fn: AmadeusFunction): Function {
    return (params: any) => {
      if (this.getPermission()) this.#limiter.schedule(() => fn(params));
      else throw new Error("Maximum global requests reached");
    }
  }
}