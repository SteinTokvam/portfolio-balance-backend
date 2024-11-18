var express = require('express');
var createError = require('http-errors');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.send('pong');
});

router.get('/pdf', function (req, res, next) {
    res.send('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').contentType('application/pdf');
});

module.exports = router;