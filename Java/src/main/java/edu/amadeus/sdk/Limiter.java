package edu.amadeus.sdk;

import java.io.Closeable;
import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletionStage;

import io.github.resilience4j.bulkhead.ThreadPoolBulkhead;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadConfig;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;

public class Limiter implements Closeable {

  public enum AmadeusEnvironment {
    TEST,
    PRODUCTION
  }

  private static final int TEST_MAX_RATE = 10;
  private static final int PROD_MAX_RATE = 40;
  private boolean debug = false;
  private RateLimiter rateLimiter;
  private ThreadPoolBulkhead executor;

  private Limiter(RateLimiterConfig rlConfig, ThreadPoolBulkheadConfig tpbConfig) {
    this.rateLimiter = RateLimiterRegistry.of(rlConfig).rateLimiter("rl");
    this.executor = ThreadPoolBulkheadRegistry.of(tpbConfig).bulkhead("bh");
  }

  public static Limiter custom(Duration timeoutDuration, Duration limitRefreshPeriod, int limitForPeriod) {
    RateLimiterConfig rlConfig = RateLimiterConfig.custom()
      .timeoutDuration(timeoutDuration)
      .limitRefreshPeriod(limitRefreshPeriod)
      .limitForPeriod(limitForPeriod)
      .build();

    ThreadPoolBulkheadConfig tpbConfig = ThreadPoolBulkheadConfig.custom()
      .coreThreadPoolSize(10)
      .maxThreadPoolSize(50)
      .build();

    return new Limiter(rlConfig, tpbConfig);
  }

  public static Limiter forEnvironment(AmadeusEnvironment env) {
    int limitForPeriod = env == AmadeusEnvironment.TEST ? TEST_MAX_RATE : PROD_MAX_RATE;
    return Limiter.custom(Duration.ofSeconds(0), Duration.ofSeconds(1), limitForPeriod);
  }

  public void setDebug(boolean debug) {
    this.debug = debug;
  }

  private static <T> Callable<T> _debug(Callable<T> fn) {
    Callable<T> fnWrapped = new Callable<T>() {
      long start = System.currentTimeMillis();
      public T call() throws Exception {
        long sent = System.currentTimeMillis();
        long sentAfter = sent - start;
        T res = fn.call();
        long receivedAfter = System.currentTimeMillis() - sent;
        System.out.println("Request sent after " + sentAfter + "ms." +
          " Response received after " + receivedAfter + "ms from sending");
        return res;
      };
    };
    return fnWrapped;
  }

  public <T> Callable<CompletionStage<T>> decorate(Callable<T> fn) {
    Callable<T> wrapped = this.debug ? Limiter._debug(fn) : fn; 
    Callable<CompletionStage<T>> schedule = new Callable<CompletionStage<T>>() {
      public CompletionStage<T> call() {
        return executor.submit(wrapped);
      }
    };
    Callable<CompletionStage<T>> rateLimited = RateLimiter.decorateCallable(this.rateLimiter, schedule);
    return rateLimited;
  }

  public void close() {
    try {
      executor.close();
    } catch (Exception e) {
      System.err.println("Failed to shutdown the limiter");
    }
  }
  
}
