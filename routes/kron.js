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
    console.log(accessKey)
    console.log(account_id)
    fetch(`https://kron.no/api/accounts/${account_id}/transactions`, getOptions(accessKey))
        .then(response => response.json())
        .then(response => res.send(response.filter(res => res.type !== 'DEP').map(res => {
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
                value: res.market_value,
                goalPercentage: 0
            }
        })))
        .catch(error => {
            console.log(error)
            next(createError(500, error))
        })
});

module.exports = router;