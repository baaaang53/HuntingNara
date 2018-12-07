'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');

router.get('/', wrapper.asyncMiddleware(async (req, res, next) => {
    console.log(req.session.user_id);
    res.type('html').sendFile(path.join(__dirname, '../public/html/index.html'));
}));

// 관리자 메인페이지
router.get('/admin', (req, res, next) => {
  res.type('html').sendFile(path.join(__dirname, '../public/html/index_admin.html'));
});

// 의뢰인 메인페이지
router.get('/client', (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/index_client.html'));
});

// 프리랜서 메인페이지
router.get('/freelancer', (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/index_freelancer.html'));
});

module.exports = router;