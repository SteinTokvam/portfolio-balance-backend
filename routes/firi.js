var express = require('express');
var createError = require('http-errors');
var router = express.Router();

function getBody(cryptoMarket, time) {
    return `{\"operationName\":\"PriceHistory\",\"variables\":{\"period\":\"${time}\",\"market\":\"${cryptoMarket}\"},\"query\":\"query PriceHistory($market: ID!, $period: PNLPeriod!) {\\n  market: market_v2(symbol: $market) {\\n    symbol\\n    baseCurrency {\\n      symbol\\n      name\\n      __typename\\n    }\\n    priceHistory(period: $period) {\\n      change\\n      data {\\n        date\\n        price\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`
}

router.post('/history', function (req, res, next) {
    const { market, time } = req.body
    fetch("https://graph.firi.com/graphql?PriceHistory", {
        "credentials": "include",
        "headers": {
            "content-type": "application/json",
        },
        "body": getBody(market, time),
        "method": "POST",
    }).then(result => result.json())
        .then(result => res.send(result.data.market.priceHistory.data.map(data => {
            return {
                date: data.date.split("T")[0],
                price: parseFloat(data.price)
            }
        }
        )));
});

module.exports = router;