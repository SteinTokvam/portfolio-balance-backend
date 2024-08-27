var express = require('express');
var createError = require('http-errors');
var router = express.Router();

router.get('/price', function (req, res, next) {
    fetch('https://barebitcoin.no/connect/bb.v1alpha.BBService/Price', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => res.send(response))
});

router.get('/balance', function (req, res, next) {
    const { accessKey, accountKey, account_id } = req.body
    fetch('https://api.bb.no/export/balance', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessKey}`
        }
    })
        .then(response => response.json())
        .then(response => res.send(response.filter(res => res.name === "Hovedkonto")[0]))
})

router.get('/transactions', function (req, res, next) {
    const { accessKey, accountKey, account_id } = req.body
    fetch('https://api.bb.no/export/transactions', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessKey}`
        }
    })
        .then(response => response.json())
        .then(response => {
            const filteredData = response
                .filter(item => item.inCurrency !== "NOK")
                .filter(item => item.accountId !== "acc_01J631DK3N56K40P6NC1HZXWBQ")
                .map(item => {
                    return {
                        //bb_type: 'trade',
                        transactionKey: item.id,
                        cost: item.outAmount !== '' ? parseFloat(item.outAmount) : parseFloat(item.inAmount),
                        name: item.type === "BTC_WITHDRAWAL" ? item.outCurrency : item.inCurrency,
                        type: setType(item.type),
                        date: item.createTime,
                        equityPrice: item.rateMarket,
                        e24Key: "",
                        equityShare: setEquityShare(item),
                        equityType: "Cryptocurrency",
                        fee: setFeeAmount(item)
                    };
                });
            res.send(filteredData)
        })
})
