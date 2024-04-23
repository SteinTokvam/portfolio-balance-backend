var express = require('express');
var createError = require('http-errors');
var router = express.Router();

/* GET e24 data. */
router.post('/', function (req, res, next) {
    const {ticker, exchange, period, type} = req.body
    
    if (!ticker || !exchange || !period || !type) {
        return next(createError(400, 'Missing required fields'))
    }

    fetch(`https://api.e24.no/bors/chart/${ticker}.${exchange}?period=${period}&type=${type.toLowerCase()}`)
        .then(res => res.json())
        .then(data => {
            res.send(data.data.map(item => {
                return {
                    date: new Date(item[0]),
                    value: item[1]
                }
            }))
        })
        .catch(error => {
            console.log(error)
            next(createError(500, error))
        });
    
});

module.exports = router;
