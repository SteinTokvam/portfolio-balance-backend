var express = require('express');
var createError = require('http-errors');
var router = express.Router();

function getOptions(api_key) {
    return {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
        }
    }
}


router.post('/transactions', function (req, res, next) {
    const { accessKey, account_id } = req.body
    fetch(`https://kron.no/api/accounts/${account_id}/transactions`, getOptions(accessKey))
        .then(response => response.json())
        .then(response => res.send(response.filter(res => res.type !== 'DEP' && res.status !== 'PROCESSING').map(res => {
            return {
                key: res.id,
                cost: res.amount,
                name: res.fund_name,
                type: res.type,
                date: res.date,
                equityPrice: "",
                e24Key: "",
                equityShare: "",
                equityType: "Fund"
            }
        })))
        .catch(error => {
            console.log(error)
            next(createError(500, error))
        })
});

router.post('/holdings', function (req, res, next) {
    const { accessKey, accountKey, account_id } = req.body
    fetch(`https://kron.no/api/accounts/${account_id}/position-performances`, getOptions(accessKey))
        .then(response => response.json())
        .then(response => res.send(response.map(res => {
            return {
                name: res.security_name,
                accountKey: accountKey,
                equityShare: res.units,
                equityType: "Fund",
                equityShare: res.units,
                value: res.market_value,
                goalPercentage: 0,
                yield: res.profit,
                isin: res.isin,
            }
        })))
        .catch(error => {
            console.log(error)
            next(createError(500, error))
        })
});

router.post('/development', function (req, res, next) {
    const { accessKey, account_id, interval } = req.body

    fetch(`https://kron.no/api/v4/accounts/${account_id}/development?interval=${interval}`, getOptions(accessKey))
        .then(response => response.json())
        .then(response => res.send(response.data.series.map(res => {
            return {
                yield_percentage: res.yield.value,
                date: res.date,
                yield_in_currency: res.return.value,
                market_value: res.market_value.value
            }
        })))
});

module.exports = router;