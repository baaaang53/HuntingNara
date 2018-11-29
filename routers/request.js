'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');

// 의뢰등록 - 의뢰 정보 입력 페이지
router.get('/register', (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_register.html'));
});

// 의뢰등록 - form submit
router.post('/register', wrapper.asyncMiddleware(async (req, res, next) => {
    const title = req.body.title;
    const cost = req.body.cost;
    const s_date = req.body.s_date;
    const e_date = req.body.e_date;
    const career = req.body.career;
    const language = req.body.language;
    const competence = req.body.competence;
    const queryResult = await db.insert({
        into: 'REQUEST',
        attributes: ['C_ID', 'TITLE', 'COST', 'S_DATE', 'E_DATE', 'CAREER'],
        values: ['admin', title, cost, s_date, e_date, career]
    });

    res.type('html').sendFile(path.join(__dirname, '../public/html/index.html'));
}));

// 의뢰 목록 페이지
router.get('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list.html'));
}));

// 의뢰 목록 요청
router.post('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*']
    });
    res.json(queryResult);
}));

module.exports = router;