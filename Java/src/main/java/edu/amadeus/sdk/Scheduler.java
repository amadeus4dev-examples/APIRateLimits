package edu.amadeus.sdk;

import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;

import io.github.resilience4j.bulkhead.ThreadPoolBulkhead;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadConfig;
import io.github.resilience4j.bulkhead.ThreadPoolBulkheadRegistry;

public class Scheduler {

  private ThreadPoolBulkhead executor;

  private static ThreadPoolBulkheadConfig getRateLimitConfig(int maxConcurrent) {
    return ThreadPoolBulkheadConfig.custom()
      .maxThreadPoolSize(maxConcurrent)
      .coreThreadPoolSize(maxConcurrent)
      .queueCapacity(100)
      .build();
  }

  protected Scheduler setMaxConcurrent(int maxConcurrent) {
    ThreadPoolBulkheadConfig tpb = getRateLimitConfig(maxConcurrent);
    this.executor = ThreadPoolBulkheadRegistry.of(tpb).bulkhead("Executor");
    return this;
  }

  protected <R> CompletableFuture<R> submit(Callable<R> task) {
    return this.executor.submit(task).toCompletableFuture();
  }

  protected void close() throws RuntimeException {
    try {
      this.executor.close();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
