'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');

router.get('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/message_list.html'));
}));

router.post('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    const queryResult = await db.join({
        select: ['MESSAGE.M_NUM', 'MESSAGE.CONTENT', 'MESSAGE.DATETIME', 'MESSAGE.STATE', 'USER.NAME'],
        from: 'MESSAGE',
        join: 'LEFT JOIN USER',
        on: {
            'MESSAGE.S_ID': 'USER.ID'
        },
        where: {
            'MESSAGE.R_ID': id
        }
    });
    res.json(queryResult);
}));

router.post('/send', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    const rId = req.body.rId;
    const content = req.body.content;
    const queryResult = await db.insert({
        into: 'MESSAGE',
        attributes: ['CONTENT', 'DATETIME', 'S_ID', 'R_ID'],
        values: [content, new Date().valueOf(), id, rId]
    });
}));

router.post('/read', wrapper.asyncMiddleware(async (req, res, next) => {
    const mNum = req.body.mNum;
    const queryResult = await db.update({
        table: 'MESSAGE',
        set: {
            STATE: 'read'
        },
        where: {
            M_NUM: mNum
        }
    });
    res.json({success: queryResult == 'success'});
}));

module.exports = router;