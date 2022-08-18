# Managing Amadeus API rate limits using the Python SDK

## Prerequisites
* Python 3

## Getting started
To implement the rate limits management in a Python environment we are going to use the provided `limiter` function, which can be used as a decorator with the functions you wish to limit. The limiter functions works with the [`ratelimit`](https://pypi.org/project/ratelimit/) library. The `limiter` decorator accepts the following parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
|`calls`    | `1000`   | Set the maximum number of times the decorated function can be called within the `refresh` interval. Calls made after the `calls` limit within the same refresh interval are dropped and a `RateLimitException` is raised |
|`refresh`  | `3600` (One hour)   | Set the time period in seconds to reset the function call counter |
|`time_between`    | `0.5` | Set the minimum time in seconds between each function call |

Lets take a look at some examples using the [Amadeus Python SDK](https://github.com/amadeus4dev/amadeus-python)

```python
nb_requests = 50
search_params = {
  'originLocationCode': 'MAD',
  'destinationLocationCode': 'LHR',
  'departureDate': departure_date,
  'returnDate': return_date,
  'adults': 1,
  'travelClass': 'ECONOMY'
}

# Using the limiter decorator we will limit calls to the flight_offer_search API
# to 5 calls each 5s with a minimum time of 500ms between each request
@limiter(calls=5, refresh=5, time_between=0.5)
def flights_offers_search(**kwargs):
  elapsed = time.time() - start
  print(f'Request sent after {elapsed:.3f}s', flush=True)
  return amadeus.shopping.flight_offers_search.get(**kwargs)

results = []
#All requests are executed simultaneously thanks to max_workers=request_nb
with concurrent.futures.ThreadPoolExecutor(max_workers=nb_requests) as executor:
  #Create nb_requests futures
  futures = {executor.submit(flights_offers_search, i, **search_params): i for i in range(nb_requests)}

  #Iterate the completed futures. Futures are yield when completed
  for future in concurrent.futures.as_completed(futures):
    try:
      results.append(future.result())
      successful += 1
    except ResponseError as error:
      failed += 1
    finally:
      if successful + failed == nb_requests:
        print(f'Requests completed with {successful} successes and {failed} fails')

for result in results:
  print(results[0].data[0]['price']['grandTotal'])

```

To visualize the limiter's functioning we will fire 50 requests simultaneously using Python's `ThreadPoolExecutor`.
We add all tasks to an executor whose `max_workers` parameter is set to the number of requests, so all of them can be executed concurrently. To respect the rate limits we decorate the function `flights_offer_search` so the API rates are respected during execution.

At the end we print the price of the first offer from each search, when all `Future`s finished execution.

As we set the limits to a maximum of 5 requests each 5s and a time between each of 500ms, we should see the first 5 requests being sent normally, the 5 next being dropped and after the 10 first requests the `refresh` parameter of 5s is reached. Then we should see the same behavior with the next 5 requests being sent and the last 5 being dropped. The output of the execution is the following:

```
Sending requests...
Request sent after 0.004s
Request sent after 0.514s
Request sent after 1.015s
Request sent after 1.517s
Request sent after 2.018s
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limiter's refresh reached
Request sent after 5.055s
Request sent after 5.556s
Request sent after 6.079s
Request sent after 6.580s
Request sent after 7.082s
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
Limit of 5 calls reached within 5s. Dropping request.
```

## Demo

In the repository you can find a simple example in the file `rate_limits.py`, where the rate limits of Amadeus APIs are managed using the `ratelimit` library and 50 simultaneously requests are sent to the Amadeus APIs. To play around with this example simply run the commands below, after setting your amadeus credentials in the environments variables `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.

```bash
pip install -r requirements.txt
python rate_limits.py
```