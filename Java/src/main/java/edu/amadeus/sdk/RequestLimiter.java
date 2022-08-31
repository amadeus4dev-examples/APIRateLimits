package edu.amadeus.sdk;

import java.time.Duration;

public class RequestLimiter {

  private static final int TEST_MAX_RATE = 1;
  private static final int PROD_MAX_RATE = 40;
  private static final Duration TEST_REFRESH = Duration.ofMillis(400);
  private static final Duration PROD_REFRESH = Duration.ofMillis(4000);
  private static final int TEST_MAX_CONCURRENT = 10;
  private static final int PROD_MAX_CONCURRENT = 40;
  protected Debugger debugger = null;
  protected Throttler throttler = null;
  protected Scheduler scheduler = null;

  /**
   * Return an instance of RequestLimiter set up for the test environment
   */
  protected static RequestLimiter forTest() {
    RequestLimiter self = new RequestLimiter();
    self.throttler =  (new Throttler()).setFrequencyLimits(TEST_REFRESH, TEST_MAX_RATE);
    self.scheduler =  (new Scheduler()).setMaxConcurrent(TEST_MAX_CONCURRENT);
    return self;
  }

  /**
   * Return an instance of RequestLimiter set up for the production environment
   */
  protected static RequestLimiter forProduction() {
    RequestLimiter self = new RequestLimiter();
    self.throttler = (new Throttler()).setFrequencyLimits(PROD_REFRESH, PROD_MAX_RATE);
    self.scheduler = (new Scheduler()).setMaxConcurrent(PROD_MAX_CONCURRENT);
    return self;
  }
}
