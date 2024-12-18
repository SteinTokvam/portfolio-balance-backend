var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
require('dotenv').config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var e24Router = require('./routes/e24');
var kronRouter = require('./routes/kron');
var pingRouter = require('./routes/ping');
var firiRouter = require('./routes/firi')
var newswebRouter = require('./routes/newsweb')
var barebitcoinRouter = require('./routes/barebitcoin')
var walletRouter = require('./routes/btcaddress')
var fundingpartnerRouter = require('./routes/fundingpartner')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/e24', e24Router);
app.use('/kron', kronRouter);
app.use('/ping', pingRouter);
app.use('/firi', firiRouter);
app.use('/newsweb', newswebRouter);
app.use('/barebitcoin', barebitcoinRouter)
app.use('/btcwallet', walletRouter)
app.use('/fundingpartner', fundingpartnerRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(204);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
