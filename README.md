# API Rate Limits

## Introduction
API rate limits are a extremely important concept when designing public APIs. These limits exist to control the amount of incoming and outgoing network traffic to or from the API, which helps preventing server overloads and consequently protects the overall performance. Moreover, this practice protects against certain attacks, for example, DoS attacks that can take the entire system down.

The rate limits must be applied on the server side and managed by the client depending on its use case.

## How to implement on client side

There is two principal limits that must be managed. The first one is the total requests for APIs that charge per request, this helps avoid unexpected high billings. You can define a limiter that drops all requests for a certain API after a threshold of 10.000 per month. You can even configure the limiter to put the requests on hold until the next billing period. The second use case is concerning the technical rate limits imposed by the APIs themselves. For example, for the Self-Service APIs, you must not exceed 1 request per 100ms. Although this can also be managed in the client side, and we can indeed send no more than 1 request each 100ms, due to network latencies it's impossible to guarantee the requests are going to reach the server respecting the rate limits. However, there is some mechanisms that can be implemented in order to get less rate limit error for high request rate needs.

To illustrate a clear use case of managing API rate limits in the client side, lets use a prototype application from Amadeus for Developers. The applications is a flight search tool with a calendar feature which shows prices for dates nearby the selected ones. This app is accessible [here](https://github.com/gustavo-bertoldi/FlightSearchCalendar)

![Calendar](imgs/Calendar.png)

The above image shows a screenshot of the app's calendar feature, we can see it shows prices for 3 days before and after the selected dates, both on departure and return dates. To fetch all the displayed prices, we have to make 49 request to the ***FlightOffersSearch*** API from the Amadeus Self-Service catalog. In the test environment, this API is limited to 1 request/100ms, so we cannot send all requests at once, otherwise we will get rate limits errors as response.

To manage this limits we have mainly two options, use an external library or build a request queue from scratch. The choice depends on you resources and requisites. There is some great open source ones available for the main programming languages. In this repository tou can find example in Node, Python and Java using the respective Amadeus SDK.

