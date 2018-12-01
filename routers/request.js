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
    const cId = 'admin'; //나중에 할 곳
    const title = req.body.title;
    const cost = req.body.cost;
    const s_date = req.body.s_date;
    const e_date = req.body.e_date;
    const career = req.body.career;
    const language = req.body.language;
    const competence = req.body.competence;
    let queryResult = await db.insert({
        into: 'REQUEST',
        attributes: ['C_ID','F_ID', 'TITLE', 'COST', 'S_DATE', 'E_DATE', 'CAREER'],
        values: [cId, "admin", title, cost, s_date, e_date, career]
    });
    queryResult = await db.getQueryResult('SELECT R_NUM FROM REQUEST WHERE C_ID="' + cId + '" ORDER BY R_NUM DESC LIMIT 1;');
    const requestNum = queryResult[0]['R_NUM'];
    for (let i=0; i<language.length; i++) {
        if (language[i]) {
            queryResult = await db.insert({
                into: 'REQ_ABILITY',
                attributes: ['R_NUM', 'LANGUAGE', 'COMPETENCE'],
                values: [requestNum, language[i], competence[i]],
            });
        }
    }
    res.json({success: queryResult=='success'});
}));

// 의뢰 목록 페이지
router.get('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list.html'));
}));


//~~~~~~~~~~~~질문~~~~~~~~~이 router.get은 freelancer, client 안 만들고 그냥 하나로 쓰는 거 맞지?!?!?



// 의뢰 목록 요청 _ 관리자
router.post('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*']
    });
    res.json(queryResult);
}));

// 의뢰 목록 요청 _ 프리랜서
router.post('/freelancer/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: { F_ID :"admin"} //수정필요
    });
    res.json(queryResult);
}));

// 의뢰 목록 요청 _ 의뢰자
router.post('/client/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where : { C_ID : "admin"} //수정 필요
    });
    res.json(queryResult);
}));

module.exports = router;