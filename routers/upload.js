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

// 회원가입 - 외부 포트폴리오 저장
router.post('/portfolio', upload.single('portfolio'), wrapper.asyncMiddleware(async (req, res, next) => {
    console.log('body');
    console.log(req.body);
    console.log('file');
    console.log(req.file)
    const portfolio = '/public/upload/' + req.file.filename;
    const id = req.body.id;
    const queryResult = await db.insert({
        into: 'OUTER_PORTFOLIO',
        attributes: ['F_ID', 'CONTENT'],
        values: [id, portfolio]
    })

}));

// 의뢰 등록 - 의뢰문서 저장
router.post('/req_doc', upload.array('req_doc'), wrapper.asyncMiddleware(async (req, res, next) => {
    console.log(req.files);
    const rNum = req.body.rNum;
    let queryResult;
    for (const file of req.files) {
        queryResult = await db.insert({
            into: 'REQ_DOC',
            attributes: ['R_NUM', 'FILE'],
            values: [rNum, '/public/upload/' + file.filename]
        });
    }
    // 세션 아이디 필요!
}));

// 의뢰 완료 요청 - 보고서 제출
router.post('/report', upload.single('report'), (req, res, next) => {
    //res.json(req.file);
});

module.exports = router;