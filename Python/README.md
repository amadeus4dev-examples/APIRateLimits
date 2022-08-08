# Managing Amadeus API rate limits using the Python SDK

## Prerequisites
* Python 3

## Getting started
To implement the rate limits management in a Python environment we are going to use the  [`ratelimit`](https://pypi.org/project/ratelimit/).
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

# Using ratelimit package we can decorate a function with @sleep_and_retry
# so the thread executing the function will sleep after the number of calls
# defined in the @limits decorator is reached within the period also defined
# in the @limits decorator
@sleep_and_retry
@limits(calls=1, period=0.1)
def flights_offers_search(call_nb, **args):
  amadeus.shopping.flight_offers_search.get(**args)

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

We add all tasks to an executor whose `max_workers` parameter is set to the number of requests, so all of them can be executed concurrently. To respect the rate limits we decorate the function `flights_offer_search` so the API rates are respected during execution.

At the end we print the price of the first offer from each search, when all `Future` finished execution.

## Demo

In the repository you can find a simple example in the file `rate_limits.py`, where the rate limits of Amadeus APIs are managed using the `ratelimit` library and 50 simultaneously requests are sent to the Amadeus APIs. To play around with this example simply run the commands below, after setting your amadeus credentials in the environments variables `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.

```bash
pip install -r requirements.txt
python rate_limits.py
```