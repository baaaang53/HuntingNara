'use strict';
const express = require('express');
const router = express.Router();
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');

router.get('/', wrapper.asyncMiddleware(async (req, res, next) => {
    const user = await db.getQueryResult('SELECT * FROM test');
    console.log(user)
    res.json(user);
}));

router.post('/insert', wrapper.asyncMiddleware(async (req, res, next) =>{
    const newName = req.body.name;
    const newPhone = req.body.phone;

    console.log(await db.getQueryResult(`INSERT INTO user (name, phone) values ('${newName}', '${newPhone}')`));
    res.json({success: true});
}));

router.post('/login', (req, res, next) => {
    console.log(req.body);
    res.json({body: req.body});
});

module.exports = router;