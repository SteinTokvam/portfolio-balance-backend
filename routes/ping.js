var express = require('express');
var createError = require('http-errors');
var router = express.Router();

router.get('/ping', function (res, req, next) {
    res.send('pong')
})