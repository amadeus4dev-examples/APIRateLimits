require('dotenv').config({path: '../.env'});
const Amadeus = require('amadeus');
const { Limiter, Duration } = require('./Limiter');


let amadeus = new Amadeus();
let limiter = Limiter.forTest().setGlobalLimits(Duration.FromMilliseconds(5000), 10);

function wait(ms) {
  return new Promise((resolve, _) => {
    setTimeout(() => resolve(), ms);
  })
}

async function test() {
  let flightOffersSearch = limiter.wrap(a => amadeus.referenceData.locations.airports.get(a));
  for (let i = 0; i < 20; i++) {
    try {
      flightOffersSearch({
        longitude: 2.55,
        latitude: 49,
        page: {
          limit: 1
        }
      }).then(a => {})
      .catch(a => console.error('Failed'));
    } catch (e) {
      console.error(e)
    }
  
    if (i == 9) await wait(5000)
  }
};
test();



