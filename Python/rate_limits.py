from asyncio import ALL_COMPLETED, Future
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

for i in range(0,15):
  results.append(flights_offers_search(**search_params))


concurrent.futures.wait(results, timeout=None, return_when=ALL_COMPLETED)

for res in results:
  print(res.Response)


# Print all successes

# for result in results:
#   print(results[0].data[0]['price']['grandTotal'])