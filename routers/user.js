'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/upload');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage });

// 회원가입 - 사용자 정보 입력 페이지
router.get('/register', wrapper.asyncMiddleware(async (req, res, next) => {
    // res.sendFile('../public/html/user_register.html');
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_register.html'));
}));

// 회원가입 - 아이디 중복 검사
router.post('/checkId', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.body.id;
    const queryResult = await db.select({
        from: 'USER',
        what: ['COUNT(ID)'],
        where: {
            ID: id
        }
    });
    res.json({duplicated: queryResult[0]['COUNT(ID)'] != 0});
}));

// 회원가입 - form submit
router.post('/register', upload.single('portfolio'), wrapper.asyncMiddleware(async (req, res, next) => {
    const type = req.body.type;
    const id = req.body.id;
    const pw = req.body.pw;
    const name = req.body.name;
    const phone = req.body.phone;
    let queryResult;
    if (type == 'freelancer') {
        const age = req.body.age;
        const career = req.body.career;
        const major = req.body.major;
        const language = req.body.language;
        const competence = req.body.competence;
        const portfolio = '/public/upload/' + req.file.filename;
        queryResult = await db.insert({
            into: 'USER',
            attributes: ['ID', 'PW', 'PHONE', 'NAME', 'TYPE', 'CAREER', 'AGE', 'MAJOR'],
            values: [id, pw, phone, name, type, career, age, major]
        });
        if (queryResult == 'success') {
            for (let i=0; i<language.length; i++) {
                if (language[i]) {
                    queryResult = await db.insert({
                        into: 'F_ABILITY',
                        attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                        values: [id, language[i], competence[i]],
                    });
                }
            }
        }
        if (queryResult == 'success') {
            queryResult = await db.insert({
                into: 'OUTER_PORTFOLIO',
                attributes: ['F_ID', 'CONTENT'],
                values: [id, portfolio]
            })
        }
    } else {
        queryResult = await db.insert({
            into: 'USER',
            attributes: ['ID', 'PW', 'PHONE', 'NAME', 'TYPE'],
            values: [id, pw, phone, name, type]
        });
    }
    res.json({success: queryResult=='success'});
}));

// 사용자 목록 페이지
router.get('/list', wrapper.asyncMiddleware(async (req, res, next)=> {
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_list.html'));
}));

// 사용자 목록 요청
router.post('/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'USER',
        what: ['*']
    });
    res.json(queryResult);
}));

// 이건 왜 여기있지??
router.get('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryObject = url.parse(req.url, true).query;
    const ID = queryObject['ID'];
    const queryResult1 = await db.select({
        from: 'F_ABILITY',
        what: ['*'],
        where: {ID: ID}
    });
    const queryResult2 = await db.select({
        from: 'OUTER_PORTFOLIO',
        what: ['*'],
        where: {F_ID: ID}
    });
    const queryResult3 = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: {F_ID: ID,
            STATE : "complete"} // innerportfolio
    });
    const result = {
        ability: queryResult1,
        outerportfolio: queryResult2,
        innerportfolio: queryResult3
    }
    res.json(result);
}));

// 이건 왜 여기있지2
router.post('/login', (req, res, next) => {
    console.log(req.body);
    res.json({body: req.body});
});

module.exports = router;