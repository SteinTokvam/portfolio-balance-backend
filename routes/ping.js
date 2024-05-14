var express = require('express');
var createError = require('http-errors');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.send('pong');
});

module.exports = router;