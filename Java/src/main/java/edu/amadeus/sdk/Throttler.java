package edu.amadeus.sdk;

import java.time.Duration;
import java.util.function.Function;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;

public class Throttler {
  private RateLimiter frequencyThrottler = null;;
  private RateLimiter globalThrottler = null;

  private static RateLimiterConfig getRateLimitConfig(Duration refreshPeriod, int limit) {
    return RateLimiterConfig.custom()
      .timeoutDuration(Duration.ofSeconds(60))
      .limitRefreshPeriod(refreshPeriod)
      .limitForPeriod(limit)
      .build();
  }

  protected Throttler setFrequencyLimits(Duration limitRefreshPeriod, int limitForPeriod) {
    RateLimiterConfig frl = getRateLimitConfig(limitRefreshPeriod, limitForPeriod);
    this.frequencyThrottler = RateLimiterRegistry.of(frl).rateLimiter("Frequency throttler");
    return this;
  }

  protected Throttler setGlobalLimits(Duration globalPeriod, int globalLimitForPeriod) {
    RateLimiterConfig grl = getRateLimitConfig(globalPeriod, globalLimitForPeriod);
    this.globalThrottler = RateLimiterRegistry.of(grl).rateLimiter("Global throttler");
    return this;
  }

  protected <P, R> Function<P, R> wrapLimiter(Function<P, R> fn) {
    if (frequencyThrottler != null) fn = RateLimiter.decorateFunction(this.frequencyThrottler, fn);
    if (globalThrottler != null) fn = RateLimiter.decorateFunction(this.globalThrottler, fn);
    return fn;
  }

}
