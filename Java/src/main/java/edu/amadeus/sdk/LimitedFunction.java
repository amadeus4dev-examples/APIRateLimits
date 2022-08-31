package edu.amadeus.sdk;

import java.io.Closeable;
import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;


public class LimitedFunction<P, R> implements Closeable {
  
  private final Function<P, R> baseFn;
  private RequestLimiter limiter;
  private Function<P, R> fn;
  private Debugger db;

  public LimitedFunction(Function<P, R> fn) {
    this.limiter = RequestLimiter.forTest();
    this.baseFn = fn;
    this.fn = limiter.throttler.wrapLimiter(fn);
    this.db = new Debugger();
  }

  public LimitedFunction<P, R> setGlobalLimits(Duration refresh, int limit) {
    this.limiter.throttler.setGlobalLimits(refresh, limit);
    this.fn = limiter.throttler.wrapLimiter(baseFn);
    return this;
  }

  public LimitedFunction<P, R> setFrequencyLimits(Duration refresh, int limit) {
    this.limiter.throttler.setFrequencyLimits(refresh, limit);
    this.fn = limiter.throttler.wrapLimiter(baseFn);
    return this;
  }

  public LimitedFunction<P, R> setMaxConcurrent(int maxConcurrent) {
    this.limiter.scheduler.setMaxConcurrent(maxConcurrent);
    return this;
  }

  public LimitedFunction<P, R> forProduction() {
    this.limiter = RequestLimiter.forProduction();
    this.fn = limiter.throttler.wrapLimiter(baseFn);
    return this;
  }

  public LimitedFunction<P, R> setDebugger() {
    this.fn = db.wrapDebugger(this.fn);
    return this;
  }

  private Callable<R> toCallable(P params) {
    return new Callable<R>() {
      public R call() throws Exception {
        return fn.apply(params);
      }
    };
  }

  public CompletableFuture<R> get(P params) {
    return this.limiter.scheduler.submit(toCallable(params));
  }

  public void close() {
    this.limiter.scheduler.close();
  }

}
