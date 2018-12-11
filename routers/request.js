'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const url = require('url');
const multer = require('multer');

// 파일 업로드 모듈
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/upload');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage });

// datetime -> date
function getDate() {
    const date = new Date();
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

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
    queryResult = await db.getQueryResult(
        'SELECT R_NUM FROM REQUEST WHERE C_ID="' + cId + '" ORDER BY R_NUM DESC LIMIT 1;');
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
    res.json({success: queryResult == 'success'})
}));

// 의뢰 삭제
router.post('/delete', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const queryResult = await db.delete({
        from: 'REQUEST',
        where: {
            R_NUM: rNum
        }
    });
    res.json({success: queryResult == 'success'});
}));

// 의뢰 수정 페이지
router.get('/modify', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_modify.html'));
}));
router.get('/modify_admin', wrapper.asyncMiddleware(async (req,res,next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_modify_admin.html'));
}))

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
router.get('/list/admin', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_list_admin.html'))}));

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
router.post('/apply/ask', wrapper.asyncMiddleware(async (req, res, next) => {
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
    queryResult = await db.insert({
        into: 'APPLIED_REQ',
        attributes: ['R_NUM', 'F_ID'],
        values: [rNum, id]
    });
    res.json({success: queryResult == 'success'});
}));

// 의뢰 수락하기
router.post('/apply/accept', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    const rNum = req.body.rNum;
    const fId = req.body.fId;
    let queryResult = await db.update({
        table: 'REQUEST',
        set: {
            F_ID: fId,
            STATE: 'working',
            S_WORKING: getDate()
        },
        where: {
            R_NUM: rNum
        }
    });
    queryResult = await db.delete({
        from: 'APPLIED_REQ',
        where: {
            R_NUM: rNum
        }
    });
    res.json({success: queryResult == 'success'});
}));

// 완료 요청 페이지
router.get('/complete/ask', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_complete_ask.html'));
}));

// 완료 요청하기
router.post('/complete/ask', upload.single('report'), wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const report = req.file.filename;
    const queryResult = await db.update({
        table: 'REQUEST',
        set: {
            STATE: 'c_requesting',
            REPORT: '/public/upload/' + report
        },
        where: {
            R_NUM: rNum
        }
    })
    res.json({success: queryResult == 'success'});
}));

// 완료 요청 수락 페이지
router.get('/complete/accept', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_complete_accept.html'));
}));

// 완료 요청 수락하기
router.post('/complete/accept', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    let queryResult = await db.update({
        table: 'REQUEST',
        set: {
            STATE: 'complete',
            E_WORKING: getDate()
        },
        where: {
            R_NUM: rNum
        }
    });
    queryResult = await db.select({
        from: 'REQUEST',
        what: ['F_ID', 'TITLE'],
        where: {
            R_NUM: rNum
        }
    });
    const id = req.session.user_id;
    const fId = queryResult[0]['F_ID'];
    const title = queryResult[0]['TITLE'];
    const content = '의뢰 완료 수락됨<br>의뢰제목: ' + title + '<br><button type=\\"button\\" onclick=\\"window.open(\'/request/complete/rate?rNum=' + rNum +'\')\\">평점입력</button>';        // 상세정보 페이지 보여주면 좋을 듯
    queryResult = await db.insert({
        into: 'MESSAGE',
        attributes: ['CONTENT', 'DATETIME', 'S_ID', 'R_ID'],
        values: [content, getDate(), id, fId]
    })
    res.json({success: queryResult == 'success'});
}));

// 의뢰 완료 평점 입력 페이지
router.get('/complete/rate', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.query.rNum;
    if (req.session.user_type == 'client') {
        let queryResult = await db.select({
            from: 'REQUEST',
            what: ['F_RATE'],
            where: {
                R_NUM: rNum
            }
        });
        if (queryResult[0]['F_RATE']) {
            res.redirect('/');
            return;
        }
    } else if (req.session.user_type == 'freelancer') {
        let queryResult = await db.select({
            from: 'REQUEST',
            what: ['C_RATE'],
            where: {
                R_NUM: rNum
            }
        });
        if (queryResult[0]['C_RATE']) {
            res.redirect('/');
            return;
        }
    }
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_complete_rate.html'));
}));

// 의뢰 완료 평점 입력
router.post('/complete/rate', wrapper.asyncMiddleware(async (req, res, next) => {
    const type = req.session.user_type;
    const rNum = req.body.rNum;
    const rate = Number(req.body.rate);
    if (type == 'freelancer') {
        let queryResult = await db.update({
            table: 'REQUEST',
            set: {
                C_RATE: rate
            },
            where: {
                R_NUM: rNum
            }
        });
        queryResult = await db.join({
            select: ['REQUEST.C_ID', 'USER.REQ_COUNT', 'USER.RATE'],
            from: 'REQUEST',
            join: 'LEFT JOIN USER',
            on: {
                'REQUEST.C_ID': 'USER.ID'
            },
            where: {
                'REQUEST.R_NUM': rNum
            }
        });
        const cId = queryResult[0]['C_ID'];
        const newReqCount = Number(queryResult[0]['REQ_COUNT']) + 1;
        const newRate = (Number(queryResult[0]['RATE']) * (newReqCount - 1) + rate) / newReqCount;
        queryResult = await db.update({
            table: 'USER',
            set: {
                REQ_COUNT: newReqCount,
                RATE: newRate
            },
            where: {
                ID: cId
            }
        });
        res.json({success: queryResult == 'success'});
    } else if (type == 'client') {
        let queryResult = await db.update({
            table: 'REQUEST',
            set: {
                F_RATE: rate
            },
            where: {
                R_NUM: rNum
            }
        });
        queryResult = await db.join({
            select: ['REQUEST.F_ID', 'USER.REQ_COUNT', 'USER.RATE'],
            from: 'REQUEST',
            join: 'LEFT JOIN USER',
            on: {
                'REQUEST.F_ID': 'USER.ID'
            },
            where: {
                'REQUEST.R_NUM': rNum
            }
        });
        const fId = queryResult[0]['F_ID'];
        const newReqCount = Number(queryResult[0]['REQ_COUNT']) + 1;
        const newRate = (Number(queryResult[0]['RATE']) * (newReqCount - 1) + rate) / newReqCount;
        queryResult = await db.update({
            table: 'USER',
            set: {
                REQ_COUNT: newReqCount,
                RATE: newRate
            },
            where: {
                ID: fId
            }
        });
        res.json({success: queryResult == 'success'});
    }
}));

// 의뢰 거절 사유 입력 페이지
router.get('/complete/reject', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_complete_reject.html'));
}));

// 의뢰 거절
router.post('/complete/reject', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    const reason = req.body.reason;
    let queryResult = await db.update({
        table: 'REQUEST',
        set: {
            STATE: 'rejected'
        },
        where: {
            R_NUM: rNum
        }
    });
    queryResult = await db.select({
        from: 'REQUEST',
        what: ['F_ID', 'TITLE'],
        where: {
            R_NUM: rNum
        }
    });
    const id = req.session.user_id;
    const fId = queryResult[0]['F_ID'];
    const title = queryResult[0]['TITLE'];
    const content = '의뢰 완료 거절됨<br>의뢰제목: ' + title + '<br>거절사유: ' + reason;        // 상세정보 페이지 보여주면 좋을 듯
    queryResult = await db.insert({
        into: 'MESSAGE',
        attributes: ['CONTENT', 'DATETIME', 'S_ID', 'R_ID'],
        values: [content, getDate(), id, fId]
    });
    res.json({success: queryResult == 'success'});
}));

// 의뢰 목록 요청 _ 관리자 -> 전체 의뢰 목록, 거절된 의뢰 목록
router.post('/list/whole', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*']
    });
    res.json(queryResult);
}));
router.post('/list/rejected', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: {STATE : "rejected"}
    });
    res.json(queryResult);
}));


// 의뢰 목록 요청 _ 프리랜서
router.post('/list/freelancer', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: { F_ID : req.session.user_id }
    });
    res.json(queryResult);
}));


// 모집중인 의뢰 보기
router.post('/list/registered', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where: {
            F_ID: 'admin'
        }
    });
    res.json(queryResult);
}));

// 지원가능 의뢰 목록 요청 _ 프리랜서(possible) _ 경력, 능력, S_DATE, E_DATE
router.post('/list/possible', wrapper.asyncMiddleware(async(req, res, next)=> {
    const id = req.session.user_id;
    let queryResult = await db.select({
        from: 'USER',
        what: ['CAREER'],
        where: {
            ID: id
        }
    });
    const career = queryResult[0]['CAREER'];
    queryResult = await db.select({
        from: 'F_ABILITY',
        what: ['LANGUAGE', 'COMPETENCE'],
        where: {
            F_ID: id
        }
    });
    const fAbility = {};
    for (const data of queryResult) {
        fAbility[data['LANGUAGE']] = data['COMPETENCE'];
    }
    const today = getDate();
    queryResult = await db.getQueryResult('SELECT A.R_NUM, A.LANGUAGE, A.COMPETENCE FROM REQ_ABILITY AS A\ ' +
        'LEFT JOIN REQUEST AS R ON A.R_NUM = R.R_NUM WHERE R.F_ID = "admin" AND R.CAREER <= ' + career + ' AND date(now()) >= date(R.S_DATE) AND date(now()) <= date(R.E_DATE);');
    const rNums = [];
    let rNum = queryResult[0]['R_NUM'];
    let flag = true;
    for (let i=0; i<queryResult.length; i++) {
        if (queryResult[i]['R_NUM'] == rNum) {
            if (!fAbility[queryResult[i]['LANGUAGE']] || fAbility[queryResult[i]['LANGUAGE']] < queryResult[i]['COMPETENCE']) {
                flag = false;
            } else if (i == queryResult.length-1) {
                if (flag) rNums.push(rNum);
            }
        } else {
            if (flag) {
                rNums.push(rNum);
            } else {
                flag = true;
            }
            rNum = queryResult[i]['R_NUM'];
            i--;
        }
        console.log(i);
    }
    if (rNums.length != 0) {
        let sql = 'SELECT * FROM REQUEST WHERE ';
        for (const r of rNums) {
            sql += 'R_NUM = ' + r + ' OR ';
        }
        sql = sql.slice(0, -4) + ';';
        queryResult = await db.getQueryResult(sql);
        res.json(queryResult);
        return;
    } else {
        res.json([]);
    }
}));


// 의뢰 목록 요청 _ 의뢰자
router.post('/list/client', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['*'],
        where : {C_ID : req.session.user_id}
    });
    res.json(queryResult);
}));

// 의뢰 상세보기 페이지
router.get('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_detail.html'));
}));

// 의뢰 상세보기
router.post('/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    let queryResult = await db.select({
        from: 'REQUEST',
        what: ['TITLE', 'F_ID', 'C_ID', 'S_DATE', 'E_DATE', 'COST', 'CAREER'],
        where: {
            R_NUM: rNum
        }
    });
    const result = {};
    for (const col in queryResult[0]) {
        result[col] = queryResult[0][col];
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
        what: ['COUNT(FILE)'],
        where: {
            R_NUM: rNum
        }
    });
    result['COUNT(FILE)'] = queryResult[0]['COUNT(FILE)'];
    res.json(result);
}));

// 의뢰 지원자 리스트 페이지
router.get('/applier/list', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_applier_list.html'));
}));

// 의뢰 지원자 리스트
router.post('/applier/list', wrapper.asyncMiddleware(async (req, res, next) => {
    const rNum = req.body.rNum;
    let queryResult = await db.select({
        from: 'REQUEST',
        what: ['STATE'],
        where: {
            R_NUM: rNum
        }
    });
    if (queryResult[0]['STATE'] != 'applying') {
        res.json({success: false});
        return;
    }
    queryResult = await db.join({
        from: 'APPLIED_REQ',
        select: ['USER.ID', 'USER.NAME', 'USER.CAREER', 'USER.RATE'],
        join: 'LEFT JOIN USER',
        on: {
            'APPLIED_REQ.F_ID': 'USER.ID'
        },
        where: {
            'APPLIED_REQ.R_NUM': rNum
        }
    });
    res.json(queryResult);
}));

// 의뢰 지원자 상세보기 페이지
router.get('/applier/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/request_applier_detail.html'));
}));

// 의뢰 지원자 상세보기
router.post('/applier/detail', wrapper.asyncMiddleware(async (req, res, next) => {
    const fId = req.body.fId;
    let queryResult = await db.select({
        from: 'USER',
        what: ['PHONE', 'NAME', 'RATE', 'CAREER', 'AGE', 'MAJOR'],
        where: {
            ID: fId
        }
    });
    const result = {};
    for (const col in queryResult[0]) {
        result[col] = queryResult[0][col];
    }
    queryResult = await db.select({
        from: 'F_ABILITY',
        what: ['LANGUAGE', 'COMPETENCE'],
        where: {
            F_ID: fId
        }
    });
    result['LANGUAGE'] = [];
    result['COMPETENCE'] = [];
    for (let i=0; i<queryResult.length; i++) {
        result['LANGUAGE'][i] = queryResult[i]['LANGUAGE'];
        result['COMPETENCE'][i] = queryResult[i]['COMPETENCE'];
    }
    queryResult = await db.select({
        from: 'REQUEST',
        what: ['TITLE', 'S_DATE', 'E_DATE', 'F_RATE', 'R_NUM'],
        where: {
            F_ID: fId,
            STATE: 'complete'
        }
    });
    result['INNER_PORTFOLIO'] = []
    for (let i=0; i<queryResult.length; i++) {
        const request = {};
        for (const col in queryResult[i]) {
            request[col] = queryResult[i][col];
        }
        result['INNER_PORTFOLIO'].push(request);
    }
    res.json(result);
}));

module.exports = router;