require('dotenv').config();
const Bottleneck = require('bottleneck');
const Amadeus = require('amadeus');
const dateFns = require('date-fns')

//Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});


//Config for test environment
//Rate limits in test environment are 1 request each 100ms and 10 requests per second
//Check the README for configuration information
const limiter = new Bottleneck({
    minTime: 500
});
const requestMax = 25;
let requestCount = 0;

//Send 50 requests at once using bottleneck
const departureDate = dateFns.format(dateFns.addDays(new Date(), 1), 'yyyy-MM-dd');
const returnDate = dateFns.format(dateFns.addDays(new Date(), 20), 'yyyy-MM-dd');
let successful = 0;
let failed = 0;
let start = Date.now();
console.log("Sending requests ...");
for (let i = 0; i < 50; i++) {

  if (requestCount < requestMax) {
    requestCount += 1;
    limiter.schedule(() => {
      let sent = (Date.now() - start) / 1000;
      console.log(`Request ${i + 1} sent after ${sent}s`)
      
      amadeus.shopping.flightOffersSearch.get({
        originLocationCode: 'MAD',
        destinationLocationCode: 'LHR',
        departureDate: departureDate,
        returnDate: returnDate,
        adults: 1,
        travelClass: 'ECONOMY'
      })
      .then(() => successful += 1)
      .catch((err) => {
        if (err.description[0].status === 429) failed += 1;
      });

    });
  } else console.log(`Request ${i + 1} dropped. Reached max of ${requestMax} requests`);
}

limiter.stop({dropWaitingJobs: false}).then(() =>
  console.log(`${successful} successful requests and ${failed} fails`)
);



