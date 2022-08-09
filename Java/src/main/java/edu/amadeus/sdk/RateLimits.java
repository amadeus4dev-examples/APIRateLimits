package edu.amadeus.sdk;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.exceptions.ResponseException;
import com.amadeus.resources.FlightOfferSearch;
import com.google.common.util.concurrent.RateLimiter;


import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

enum AmadeusEnvironment {
  TEST,
  PRODUCTION
}

public class RateLimits {
  private int successful = 0;
  private int failed = 0;
  private RateLimiter limiter;

  RateLimits() {
    this.successful = 0;
    this.failed = 0;
    limiter = RateLimiter.create(10);
  }

  RateLimits(AmadeusEnvironment apiEnvironment) {
    this.successful = 0;
    this.failed = 0;

    //Test -- 10 tx per second, 1 tx per 100ms
    if (apiEnvironment == AmadeusEnvironment.TEST) {
      limiter = RateLimiter.create(10);
    } 
    // Production -- 40tx per second
    else {
      limiter = RateLimiter.create(40);
    }
  }

  public <V> List<V> runQueries(int nbRequests, Callable<V> query) { 
    this.successful = 0;
    this.failed = 0;
  
    ExecutorService executor = Executors.newFixedThreadPool(nbRequests);
    long start = System.currentTimeMillis();

    List<V> results = new ArrayList<>(nbRequests);

    for (int i = 0; i < nbRequests; i++) {
      limiter.acquire(1);
      long elapsed = System.currentTimeMillis() - start;
      System.out.println("Request " + (i + 1) + " sent after " + elapsed + "ms");
      System.out.flush();
      executor.submit(() -> {
        try {
          V response = query.call();
          results.add(response);
          this.successful += 1;
        } catch (Exception e) {
          //System.err.println(e.getMessage());
          this.failed += 1;
        } finally {
          if (this.successful + this.failed == nbRequests) {
            System.out.println("Requests completed with " + this.successful + " successes and " + this.failed + " fails");
            System.out.flush();
          }
        } 
      });
    }
    
    try {
      executor.shutdown();
      executor.awaitTermination(30, TimeUnit.SECONDS);
    } catch (Exception e) {

    }
    return results;
  }

  public static void main(String[] args) {

    // Config Amadeus object
    Amadeus amadeus = Amadeus.builder(System.getenv()).build();

    //Get dates
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    String departureDate = LocalDate.now().format(formatter);
    String returnDate = LocalDate.now().plusWeeks(2).format(formatter);

    // Configure parameters for the query
    Params params = Params.with("originLocationCode", "MAD")
      .and("destinationLocationCode", "LHR")
      .and("departureDate", departureDate)
      .and("returnDate", returnDate)
      .and("adults", 2)
      .and("max", 3);

    Callable<FlightOfferSearch[]> flightOffersSearch = new Callable<FlightOfferSearch[]>() {
      public FlightOfferSearch[] call() throws ResponseException {
        return amadeus.shopping.flightOffersSearch.get(params);
      }
    };

    RateLimits limiter = new RateLimits();
    List<FlightOfferSearch[]> result = limiter.runQueries(50, flightOffersSearch);
    result.stream()
      .forEach(offer -> {
        if (offer != null)System.out.println(offer[0].getPrice().getTotal());
      });
  }
}