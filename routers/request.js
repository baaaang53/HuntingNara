'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const url = require('url');
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

// 의뢰등록 - 의뢰 정보 입력 페이지
router.get('/register', (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_register.html'));
});

// 의뢰등록 - form submit
router.post('/register', upload.array('document'), wrapper.asyncMiddleware(async (req, res, next) => {
    const cId = req.session.user_id;
    const title = req.body.title;
    const cost = req.body.cost;
    const s_date = req.body.s_date;
    const e_date = req.body.e_date;
    const career = req.body.career;
    const language = req.body.language;
    const competence = req.body.competence;
    const documents = req.files;
    let queryResult = await db.insert({
        into: 'REQUEST',
        attributes: ['C_ID','F_ID', 'TITLE', 'COST', 'S_DATE', 'E_DATE', 'CAREER'],
        values: [cId, "admin", title, cost, s_date, e_date, career]
    });
    if (queryResult == 'success') {
        queryResult = await db.getQueryResult(
            'SELECT R_NUM FROM REQUEST WHERE C_ID="' + cId +
            '" ORDER BY R_NUM DESC LIMIT 1;');
        const rNum = queryResult[0]['R_NUM'];
        if (typeof language == 'object') {
            for (let i = 0; i < language.length; i++) {
                if (language[i]) {
                    queryResult = await db.insert({
                        into: 'REQ_ABILITY',
                        attributes: ['R_NUM', 'LANGUAGE', 'COMPETENCE'],
                        values: [rNum, language[i], competence[i]],
                    });
                }
            }
        } else {
            queryResult = await db.insert({
                into: 'REQ_ABILITY',
                attributes: ['R_NUM', 'LANGUAGE', 'COMPETENCE'],
                values: [rNum, language, competence],
            });
        }
        if (queryResult == 'success') {
            for (const document of documents) {
                queryResult = await db.insert({
                    into: 'REQ_DOC',
                    attributes: ['R_NUM', 'FILE'],
                    values: [rNum, '/public/upload/' + document.filename]
                });
            }
        }
    }
    res.json({success: queryResult == 'success'})
}));

// 의뢰 수정 페이지
router.get('/modify', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_modify.html'));
}));

// 의뢰 정보
router.post('/info', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const result = {};
    let queryResult = await db.select({
        from: 'REQUEST',
        what: ['TITLE', 'S_DATE', 'E_DATE', 'COST', 'CAREER', 'STATE'],
        where: {
            R_NUM: rNum
        }
    });
    for (const key in queryResult[0]) {
        result[key] = queryResult[0][key];
    }
    queryResult = await db.select({
        from: 'REQ_ABILITY',
        what: ['LANGUAGE', 'COMPETENCE'],
        where: {
            R_NUM: rNum
        }
    });
    result['LANGUAGE'] = [];
    result['COMPETENCE'] = [];
    for (let i=0; i<queryResult.length; i++) {
        result['LANGUAGE'][i] = queryResult[i]['LANGUAGE'];
        result['COMPETENCE'][i] = queryResult[i]['COMPETENCE'];
    }
    queryResult = await db.select({
        from: 'REQ_DOC',
        what: ['COUNT(*)'],
        where: {
            R_NUM: rNum
        }
    });
    result['COUNT(REQ_DOC)'] = queryResult[0]['COUNT(*)'];
    res.json(result);
}));

// 의뢰 수정
router.post('/modify', upload.array('document'), wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const title = req.body.title;
    const cost = req.body.cost;
    const sDate = req.body.s_date;
    const eDate = req.body.e_date;
    const career = req.body.career;
    const language = req.body.language;
    const competence = req.body.competence;
    let queryResult = await db.update({
        table: 'REQUEST',
        set: {
            'TITLE': title,
            'COST': cost,
            'S_DATE': sDate,
            'E_DATE': eDate,
            'CAREER': career
        },
        where: {
            R_NUM: rNum
        }
    });
    queryResult = await db.delete({
        from: 'REQ_ABILITY',
        where: {
            R_NUM: rNum
        }
    });
    if (typeof language == 'object') {
        for (let i = 0; i < language.length; i++) {
            if (language[i]) {
                queryResult = await db.insert({
                    into: 'REQ_ABILITY',
                    attributes: ['R_NUM', 'LANGUAGE', 'COMPETENCE'],
                    values: [rNum, language[i], competence[i]],
                });
            }
        }
    } else {
        if (language) {
            queryResult = await db.insert({
                into: 'REQ_ABILITY',
                attributes: ['R_NUM', 'LANGUAGE', 'COMPETENCE'],
                values: [rNum, language, competence],
            });
        }
    }
    if (req.files) {
        queryResult = await db.delete({
            from: 'REQ_DOC',
            where: {
                R_NUM: rNum
            }
        });
        for (const file of req.files) {
            queryResult = await db.insert({
                into: 'REQ_DOC',
                attributes: ['R_NUM', 'FILE'],
                values: [rNum, '/public/upload/' + file.filename]
            })
        }
    }
    res.json({success: queryResult == 'success'});
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

// 의뢰 지원하기
router.post('/apply', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    const rNum = req.body.rNum;
    let queryResult = await db.update({
        table: 'REQUEST',
        set: {
            STATE: 'applying'
        },
        where: {
            R_NUM: rNum
        }
    });
    if (queryResult == 'success') {
        queryResult = await db.insert({
            into: 'APPLIED_REQ',
            attributes: ['R_NUM', 'F_ID'],
            values: [rNum, id]
        });
    }
    res.json({success: queryResult == 'success'});
}));

// 완료 요청 페이지
router.get('/askcomplete', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_askcomplete.html'));
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


module.exports = router;