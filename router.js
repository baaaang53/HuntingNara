'use strict';
const express = require('express');
const router = express.Router();

const index = require('./routers/index');
const user = require('./routers/user');
const img = require('./routers/img');
const upload = require('./routers/upload');

router.use('/', index);
router.use('/user', user);
router.use('/img', img);
router.use('/upload', upload);

module.exports = router;