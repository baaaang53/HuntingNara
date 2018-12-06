'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const url = require('url');

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

// 의뢰 목록 페이지 _관리자
router.get('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list.html'));
}));

// 의뢰 목록 페이지 _ 프리랜서
router.get('/list/freelancer', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list_freelancer.html'));
}));

// 의뢰 목록 페이지 _ 의뢰자
router.get('/list/client', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list_client.html'));
}));

// registered 의뢰 목록 페이지 _ 의뢰 지원하기
router.get('/list/registered', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list_registered.html'));
}));



// 의뢰 상세보기
/*router.get('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryObject = url.parse(req.url, true).query;
    const rNum = queryObject['rNum'];
    const queryResult1 = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: {R_NUM: rNum}
    });
    const queryResult2 = await db.select({
        from: 'REQ_DOC',
        what: ['*'],
        where: {R_NUM: rNum}
    });
    const queryResult3 = await db.select({
        from: 'REQ_ABILITY',
        what: ['*'],
        where: {R_NUM: rNum}
    });
    const result = {
        request: queryResult1,
        reqDoc: queryResult2,
        reqAbility: queryResult3
    }
    res.json(result);
}));*/


// 의뢰 목록 요청 _ 관리자
router.post('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*']
    });
    res.json(queryResult);
}));


// 의뢰 목록 요청 _ 프리랜서
router.post('/list/freelancer', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: { F_ID : "admin"} //수정필요 _ 현재 로그인 정보
    });
    res.json(queryResult);
}));


//모집중인 의뢰 보기
router.post('/list/registered', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: { STATE :"registered"} //수정필요 _ 현재 로그인 정보
    });
    res.json(queryResult);
}));


// 지원가능 의뢰 목록 요청 _ 프리랜서(possible) _ 경력, 능력
router.post('/list/freelancer/possible', wrapper.asyncMiddleware(async(req, res, next)=> {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where:{F_ID:"admin"} // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~조건을 어떻게 달아야 하는 건가요
    });
    res.json(queryResult);
}));


// 의뢰 목록 요청 _ 의뢰자
router.post('/list/client', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where : {C_ID : "admin"} //수정 필요 _ 현재 로그인 정보
    });
    res.json(queryResult);
}));

// // 의뢰 상세보기
// router.get('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
//     const queryObject = url.parse(req.url, true).query;
//     const rNum = queryObject['rNum'];
//     const queryResult = await db.select({
//         from: 'REQUEST',
//         what: ['*'],
//         where: {R_NUM: rNum}
//     });
//     // res.json(queryResult[0]);
//     res.type('html').sendFile(path.join(__dirname, '../public/html/request_askcomplete.html'));
// }));

router.post('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const queryResult = await db.select({
        from: 'REQ_DOC',
        what : ['*'],
        where: {R_NUM :rNum}
    });
    const queryResult2 = await db.select({
        from: 'REQ_ABILITY',
        what : ['*'],
        where: {R_NUM :rNum}
    });

    const result = {
        req_doc : queryResult,
        req_ability : queryResult2
    }

    res.json(result);
}));

router.get('/askcomplete', wrapper.asyncMiddleware(async (req, res, next)=> {
    //REQUEST에서 해당 r_num의 state를 c_requesting으로 바꾸기
}))
module.exports = router;