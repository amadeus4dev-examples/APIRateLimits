import time
from amadeus import Client, ResponseError
from dotenv import load_dotenv
from ratelimit import limits, sleep_and_retry
import datetime
import concurrent.futures

#Read environment variables from .env file
load_dotenv()

amadeus = Client()

departure_date = datetime.datetime.now()
return_date = (departure_date + datetime.timedelta(days=10)).strftime('%Y-%m-%d')
departure_date = departure_date.strftime('%Y-%m-%d')

nb_requests = 50
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
now = time.time()

# Using ratelimit package we can decorate a function with @sleep_and_retry
# so the thread executing the function will sleep after the number of calls
# defined in the @limits decorator is reached within the period also defined
# in the @limits decorator
@sleep_and_retry
@limits(calls=10, period=1)
def flights_offers_search(call_nb, **args):
  elapsed = time.time() - now
  print(f'Call nb {call_nb} -- Elapsed time: {elapsed}', flush=True)
  amadeus.shopping.flight_offers_search.get(**args)


print('Sending requests...')
#All requests are executed simultaneously thanks to max_workers=request_nb
with concurrent.futures.ThreadPoolExecutor(max_workers=nb_requests) as executor:
  #Create nb_requests futures
  futures = {executor.submit(flights_offers_search, i, **search_params): i for i in range(nb_requests)}

  #Iterate the completed futures. Futures are yield when completed
  for future in concurrent.futures.as_completed(futures):
    try:
      response = future.result()
      successful += 1
    except ResponseError as error:
      failed += 1
    finally:
      if successful + failed == nb_requests:
        print(f'Requests completed with {successful} successes and {failed} fails')

