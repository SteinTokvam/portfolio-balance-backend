var express = require('express');
var createError = require('http-errors');
var router = express.Router();

async function getIssuer(ticker) {
    try {
        return fetch('https://api3.oslo.oslobors.no/v1/newsreader/issuers',
            {
                method: 'POST',
            }
        )
            .then(result => result.json())
            .then(result => result.data.issuers.filter(issuer => issuer.id === ticker.toUpperCase())[0]);
    } catch (error) {
        console.log(error);
    }
}

router.post('/news', function (req, res, next) {
    const { ticker } = req.body
    if (!ticker) {
        return next(createError(400, 'Missing required fields'))
            .then(data => res.send(data))
    }

    getIssuer(ticker)
        .then(result => {
            return fetch(`https://api3.oslo.oslobors.no/v1/newsreader/list?issuer=${result.id}`,
                {
                    method: 'POST',
                }
            ).then(result => result.json())
                .then(result => res.send(result.data.messages))
        })

});

router.post('/message', function (req, res, next) {
    const { messageId } = req.body
    if (!messageId) {
        return next(createError(400, `Missing required field messageId`))
            .then(data => res.send(data))
    }
    fetch(`https://api3.oslo.oslobors.no/v1/newsreader/message?messageId=${messageId}`,
        {
            method: 'POST',
        }
    ).then(result => result.json())
        .then(result => res.send(result.data.message))
    });

module.exports = router;