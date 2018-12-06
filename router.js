'use strict';
const express = require('express');
const router = express.Router();

const index = require('./routers/index');
const user = require('./routers/user');
const img = require('./routers/img');
const request = require('./routers/request');
const message = require('./routers/message');

router.use('/', index);
router.use('/user', user);
router.use('/img', img);
router.use('/request', request);
router.use('/message', message);


module.exports = router;