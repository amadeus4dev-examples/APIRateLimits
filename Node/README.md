# Managing Amadeus API rate limits using the Node SDK

## Prerequisites
* Node

## Getting started
To implement the rate limits management in a Node environment we are going to use the JavaScript library [`bottleneck`](https://www.npmjs.com/package/bottleneck).
Lets take a look at some examples using the [Amadeus Node SDK](https://www.npmjs.com/package/amadeus)

**Test** (10 req/sec and 1 req/100ms)
```js
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  minTime: 100
})
```
**Production** (40 req/sec)
```js
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    reservoir: 40,
    reservoirRefreshAmount: 40,
    reservoirRefreshInterval: 1000
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
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    reservoir: 40,
    reservoirRefreshAmount: 40,
    reservoirRefreshInterval: 1000
  })

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
Using this strategy you don't have to worry if your client surpasses the API's rate limits, as requests are just going to be queued up and executed accordingly to these limits. To take a look at a full implementation you can refer to the GitHub repository of the above mentioned prototype [here](https://github.com/gustavo-bertoldi/FlightSearchCalendar).

## Demo

In the repository you can find a simple example in the file `rate_limits.js`, where the rate limits of Amadeus APIs are managed using `bottleneck` and 50 simultaneously requests are made to the Amadeus APIs. To play around with this example simply run the commands below, aster setting your amadeus credentials in the environments variables `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.

```bash
npm install #Or yarn install
npm start #Or yarn start
```