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
router.post('/portfolio', upload.single('portfolio'), (req, res, next) => {
    // res.json(req.file);
});

// 의뢰 완료 요청 - 보고서 제출
router.post('/report', upload.single('report'), (req, res, next) => {
    //res.json(req.file);
});

module.exports = router;