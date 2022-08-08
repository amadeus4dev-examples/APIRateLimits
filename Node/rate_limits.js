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
  minTime: 100
});

//Send 50 requests at once using bottleneck
const departureDate = dateFns.format(dateFns.addDays(new Date(), 1), 'yyyy-MM-dd');
const returnDate = dateFns.format(dateFns.addDays(new Date(), 20), 'yyyy-MM-dd');
let successful = 0;
let failed = 0;
console.log("Sending requests ...");
for (let i = 0; i < 50; i++) {
  limiter.schedule(() => 
    amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'MAD',
      destinationLocationCode: 'LHR',
      departureDate: departureDate,
      returnDate: returnDate,
      adults: 1,
      travelClass: 'ECONOMY'
    }))
    .then(() => successful += 1)
    .catch(() => failed += 1)
    .finally(() => {
      if (successful + failed === 50) 
        console.log(`${successful} successful requests and ${failed} fails`)
    })
}

