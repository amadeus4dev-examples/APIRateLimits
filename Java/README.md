# Managing Amadeus API rate limits using the Java SDK

## Prerequisites
* Java SDK 8 or newer
* Maven

## Getting started
To implement the rate limits management in a Java environment we are going to use two mechanisms, an `ExecutorService` from the `java.util.concurrent` library, instantiated with a `FixedThreadPool`, which will allow us to send requests through the Amadeus SDK asynchronously. The next tool is from the Google's Guava library, a `RateLimiter` that is going to help us schedule the execution of out calls accordingly to Amadeus' API limits.

We are going to setup a `RateLimits` class to help manage the API calls. Two constructors were defined, the first doesn't take any parameters, and the second takes the a `AmadeusEnvironment` enum which designates the environment to use in the Amadeus API, `TEST` or `PRODUCTION`. The rate limiter is instantiated accordingly to the chosen environment.

```java
 RateLimits() {
    this.successful = 0;
    this.failed = 0;
    //Test environment is default
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
```

A method called `runQueries` is also defined, this method takes in parameter the number of queries to call and the query object in the form of a `Callable`, the callable `call` function will call the desired Amadeus API. It returns a `List` containing the return type of the `Callable` object.

```java
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
          logger.error(e.getMessage());
          this.failed += 1;
        } finally {
          if (this.successful + this.failed == nbRequests) {
            System.out.println("Requests completed with " + this.successful +
              " successes and " + this.failed + " fails");
            System.out.flush();
          }
        } 
      });
    }
}
```
## Demo

To test our new class we used the following code.

```java
public static void main(String[] args) {
    // Config Amadeus object
    Amadeus amadeus = Amadeus.builder(System.getenv()).build();

    // Get dates
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    String departureDate = LocalDate.now().format(formatter); //Today date
    String returnDate = LocalDate.now().plusWeeks(2).format(formatter); //In two weeks

    // Configure parameters for the query
    Params params = Params.with("originLocationCode", "MAD")
      .and("destinationLocationCode", "LHR")
      .and("departureDate", departureDate)
      .and("returnDate", returnDate)
      .and("adults", 2)
      .and("max", 3);

    // We are going to use the Flight Offers Search API, so the call method of our Callable
    // is going to call this API fusing the Amadeus SDK and the parameters defined above
    Callable<FlightOfferSearch[]> flightOffersSearch = new Callable<FlightOfferSearch[]>() {
      public FlightOfferSearch[] call() throws ResponseException {
        return amadeus.shopping.flightOffersSearch.get(params);
      }
    };

    // We can now iterate the results and print the prices of each one of the 50 requestss
    RateLimits limiter = new RateLimits();
    List<FlightOfferSearch[]> result = limiter.runQueries(50, flightOffersSearch);
    result.stream()
      .forEach(offer -> {
        if (offer != null)System.out.println(offer[0].getPrice().getTotal());
      });
  }
```

The following code is available in `src/main/java/edu/amadeus/sdk/RateLimits.java`. You can run it in your computer with the following commands. Don't forget to add your Amadeus credentials to the environment variables `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.

```bash 
./mvnw clean verify
./mvnw compile exec:java -D exec.mainClass="edu.amadeus.sdk.RateLimits"
```