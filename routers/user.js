'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');

// router.get('/', wrapper.asyncMiddleware(async (req, res, next) => {
//     const user = await db.getQueryResult('SELECT * FROM test');
//     console.log(user)
//     res.json(user);
// }));
//
// router.post('/insert', wrapper.asyncMiddleware(async (req, res, next) =>{
//     const newName = req.body.name;
//     const newPhone = req.body.phone;
//
//     console.log(await db.getQueryResult(`INSERT INTO user (name, phone) values ('${newName}', '${newPhone}')`));
//     res.json({success: true});
// }));

// 회원가입 - 사용자 정보 입력 페이지
router.get('/register', wrapper.asyncMiddleware(async (req, res, next) => {
    // res.sendFile('../public/html/user_register.html');
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_register.html'));
}));

// 회원가입 - form submit
router.post('/register', wrapper.asyncMiddleware(async (req, res, next) => {
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
    } else {
        queryResult = await db.insert({
            into: 'USER',
            attributes: ['ID', 'PW', 'PHONE', 'NAME', 'TYPE'],
            values: [id, pw, phone, name, type]
        });
    }
    res.json({success: queryResult=='success'});
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

router.post('/login', (req, res, next) => {
    console.log(req.body);
    res.json({body: req.body});
});

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

module.exports = router;