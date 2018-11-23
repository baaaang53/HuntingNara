'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })

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
router.get('/register', (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/register.html'));
});

// 회원가입 - form submit
router.post('/register', upload.single('portfolio'), wrapper.asyncMiddleware(async (req, res, next) => {
    res.json(req.file);
}));

// 회원가입 - 아이디 중복 검사
router.post('/checkId', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.body.id;
    const queryResult = await db.getQueryResult('SELECT COUNT(ID) FROM USER WHERE ID="' + id + '"');
    res.json({duplicated: queryResult['COUNT(ID)'] != 0});
}));

router.post('/login', (req, res, next) => {
    console.log(req.body);
    res.json({body: req.body});
});

module.exports = router;