# Managing Amadeus API rate limits using the Node SDK

## Prerequisites
* Node

## Getting started
To implement the rate limits management in a Node environment we are going to use the JavaScript library [`bottleneck`](https://www.npmjs.com/package/bottleneck).
Lets take a look at some examples using the [Amadeus Node SDK](https://www.npmjs.com/package/amadeus)

## Limits
We are going to configure two main limits, a monthly threshold that will help us control monthly billing and a rate limits addressing Amadeus limits for the test environment (1 request/100ms). We will set a limit of no more than 10.000 requests per month and a scheduler to ensure requests will be sent within an interval of 400ms. As discussed previously, even though the limits of the test environment are 1 request each 100ms, due to network constraints, we cannot guarantee this requests will reach the server with the same interval they were sent, and the only way to assure all requests are successful is by sending them sequentially, waiting for each response before sending a new request, which can be slow in some cases. Using 4 times the theoretical rate limit produces a 90% success rate Also, once the 10.000 limit is reached, new requests will be kept in a waiting queue until the scheduler can execute jobs again. You can configure the the waiting queue to drop jobs after a certain threshold as well with different strategies, check `Bottleneck`'s documentation for more details.

**Test** (10 req/sec and 1 req/100ms)
```js
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  minTime: 400,
  reservoir: 10000,
  reservoirRefreshInterval: 30 * 24 * 60 * 60 * 1000, 
  reservoirRefreshAmount: 10000
})
```
**Production** (40 req/sec)
```js
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    minTime: 100,
    reservoir: 10000,
    reservoirRefreshInterval: 30 * 24 * 60 * 60 * 1000, 
    reservoirRefreshAmount: 10000
  })
```

Description of the options used for the `limiter`.
| Option | Default | Description |
|--------|---------|-------------|
| `minTime`      | `0` ms      | How long to wait after launching a job before launching a new one   |
| `maxConcurrent`   | `null` (unlimited)       | How many jobs can be executed at the same time      |
| `reservoir`   | `null` (unlimited)       | How many jobs can be executed before the limiter stops executing jobs      |
| `reservoir`   | `null` (unlimited)       | How many jobs can be executed before the limiter stops executing jobs. If the `reservoir` reaches `0`, new jobs will be queued up until the reservoir refreshes     |
| `reservoirRefreshInterval`   | `null` (disabled)       | Every `reservoirRefreshInterval` ms the reservoir will be refreshed to the value of `reservoirRefreshAmount`, which should be a multiple of 250      |
| `reservoirRefreshAmount`   | `null` (disabled)       | The value to which the reservoir is going to be set each `reservoirRefreshInterval` ms   |

More details can be found on [`bottleneck`'s GitHub page](https://github.com/SGrondin/bottleneck).

Now that the `limiter` is correctly set, instead of calling the APIs directly in the backend, we use `limiter`'s `schedule` method to queue up requests, and they are going to be executed following the defined rules.

Here's an example on how to call the ***FlightOffersSearch*** API using `bottleneck` and the `Amadeus Node SDK`.

```js
limiter.schedule(() => {
  amadeus.shopping.flightOffersSearch.get({
    originLocationCode: 'MAD',
    destinationLocationCode: 'LHR',
    departureDate: '2022-12-01',
    returnDate: '2022-12-10',
    adults: 1,
    travelClass: 'ECONOMY'
  });
});
```
Using this strategy you don't have to worry if your client surpasses the API's rate limits, as requests are just going to be queued up and executed accordingly to these limits.

## Demo

In this repository you can find a simple example in the file `rate_limits.js`, where the rate limits of Amadeus APIs are managed using `bottleneck` and 50 simultaneously requests are made to the Amadeus APIs. To play around with this example simply run the commands below, after setting your amadeus credentials in the environments variables `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.

```bash
npm install #Or yarn install
npm start #Or yarn start
```