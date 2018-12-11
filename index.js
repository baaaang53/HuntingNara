'use strict';
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');
const router = require('./router');
const config = require('./config');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));

app.use(session({
    secret: 'huntingnara',
    resave: false,
    saveUninitialized: true,
}));

app.use('/', router);

app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.log(err);

  res.status(err.status || 500);
  res.send(err);
});

const server = http.createServer(app);

server.listen(config.port);
console.log(`server start on port ${config.port}`);