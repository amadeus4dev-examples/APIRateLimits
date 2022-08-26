import time
from ratelimit import limits, sleep_and_retry
import concurrent.futures


class RateLimitException(Exception): pass

def limiter(calls = 1000, refresh=60*60, time_between=0.5, max_concurrent=10):
  
  def wrapper(fn):
  
    @sleep_and_retry
    @limits(calls=1, period=time_between)
    def send_request(*args, **kwargs):
      if (time.time() - wrapper.start_time >= refresh):
        print(f'Limiter\'s refresh reached')
        wrapper.start_time = time.time()
        wrapper.calls = 0
      
      wrapper.calls += 1

      if (wrapper.calls <= calls):
        return wrapper.executor.submit(fn, **kwargs)
      else:
        print(f'Limit of {calls} calls reached within {refresh}s. Dropping request.')
        raise RateLimitException
    
    return send_request

  wrapper.calls = 0
  wrapper.start_time = time.time()
  wrapper.executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent)
  return wrapper




  
