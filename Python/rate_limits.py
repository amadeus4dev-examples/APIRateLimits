from asyncio import Future
import time
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import datetime
import concurrent.futures
from limiter import RateLimitException, limiter

#Read environment variables from .env file
load_dotenv()

amadeus = Client()

departure_date = datetime.datetime.now()
return_date = (departure_date + datetime.timedelta(days=10)).strftime('%Y-%m-%d')
departure_date = departure_date.strftime('%Y-%m-%d')

nb_requests = 10
successful = 0
failed = 0
search_params = {
  'originLocationCode': 'MAD',
  'destinationLocationCode': 'LHR',
  'departureDate': departure_date,
  'returnDate': return_date,
  'adults': 1,
  'travelClass': 'ECONOMY'
}
start = time.time()


# Using ratelimit package we can decorate a function with @sleep_and_retry
# so the thread executing the function will sleep after the number of calls
# defined in the @limits decorator is reached within the period also defined
# in the @limits decorator
@limiter(calls=50, refresh=5, time_between=1)
def flights_offers_search(**kwargs):
  elapsed = time.time() - start
  print(f'Request sent after {elapsed:.3f}s', flush=True)
  return amadeus.shopping.flight_offers_search.get(**kwargs)


print('Sending requests...')
results = []
#All requests are executed simultaneously thanks to max_workers=request_nb
with concurrent.futures.ThreadPoolExecutor(max_workers=nb_requests) as executor:

  futures = []

  #Create nb_requests futures
  for i in range(nb_requests):
    futures.append(executor.submit(flights_offers_search, **search_params))

  #Iterate the completed futures. Futures are yield when completed
  for future in concurrent.futures.as_completed(futures):
    try:
      results.append(future.result())
      successful += 1
    except (ResponseError, RateLimitException) as error:
      failed += 1
    finally:
      if successful + failed == nb_requests:
        print(f'Requests completed with {successful} successes and {failed} fails')


# Print all successes

for result in results:
  print(results[0].data[0]['price']['grandTotal'])