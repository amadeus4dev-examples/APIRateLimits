package edu.amadeus.sdk;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.resources.FlightOfferSearch;

import io.github.cdimascio.dotenv.Dotenv;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

public class RateLimits {
  private static final Dotenv ENV = Dotenv.load();
  private static final Amadeus CLIENT = Amadeus.builder(
      ENV.get("AMADEUS_CLIENT_ID"),
      ENV.get("AMADEUS_CLIENT_SECRET")
    ).build();
  
  public static void main(String[] args) {
  
    final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    final String departureDate = LocalDate.now().format(formatter);
    final String returnDate = LocalDate.now().plusWeeks(2).format(formatter);
    final Params params = Params.with("originLocationCode", "MAD")
      .and("destinationLocationCode", "LHR")
      .and("departureDate", departureDate)
      .and("returnDate", returnDate)
      .and("adults", 2)
      .and("max", 3);


    //Wrapper for checked exception
    Function<Params, FlightOfferSearch[]> exHandled = p -> {
      try {
        return CLIENT.shopping.flightOffersSearch.get(p);
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    };
    
    LimitedFunction<Params, FlightOfferSearch[]> flightOffersSearch = new LimitedFunction<>(exHandled);
    flightOffersSearch.setGlobalLimits(Duration.ofMinutes(10), 20).setDebugger();

    List<CompletableFuture<FlightOfferSearch[]>> responses = new ArrayList<>();
    for (int i = 0; i < 20; i++) {
      try {
        responses.add(flightOffersSearch.get(params));
      } catch (Exception e) {
        System.err.println(e.getMessage());
      }
    }

    //Get responses
    responses.forEach(CompletableFuture::join); //Wait for all futures
    int i = 1;
    for (CompletableFuture<FlightOfferSearch[]> f : responses) {
      String d = "Response " + i++ + ": ";
      try {
        FlightOfferSearch[] res = f.get();
        d += res[0].getPrice().getTotal();
      } catch (Exception e) {
        d += "failed";
      }
      System.out.println(d);
    }

    flightOffersSearch.close();
    

  }
}