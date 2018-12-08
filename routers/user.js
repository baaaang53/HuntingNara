'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const wrapper = require('../modules/wrapper');
const db = require('../modules/db');
const multer = require('multer');
const crypto = require('crypto');

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
    const name = req.body.name;
    const phone = req.body.phone;
    crypto.randomBytes(64, (err, buf) => {
         crypto.pbkdf2(req.body.pw, buf.toString('base64'), 100000, 64, 'sha512', async (err, key) => {
             const pw = key.toString('base64');
             const salt = buf.toString('base64');
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
                     attributes: ['ID', 'PW', 'SALT', 'PHONE', 'NAME', 'TYPE', 'CAREER', 'AGE', 'MAJOR'],
                     values: [id, pw, salt, phone, name, type, career, age, major]
                 });
                 if (typeof language == 'object') {
                     for (let i = 0; i < language.length; i++) {
                         if (language[i]) {
                             queryResult = await db.insert({
                                 into: 'F_ABILITY',
                                 attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                                 values: [id, language[i], competence[i]],
                             });
                         }
                     }
                 } else {
                     queryResult = await db.insert({
                         into: 'F_ABILITY',
                         attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                         values: [id, language, competence],
                     });
                 }
                 queryResult = await db.insert({
                     into: 'OUTER_PORTFOLIO',
                     attributes: ['F_ID', 'CONTENT'],
                     values: [id, portfolio]
                 })
             } else {
                 queryResult = await db.insert({
                     into: 'USER',
                     attributes: ['ID', 'PW', 'SALT', 'PHONE', 'NAME', 'TYPE'],
                     values: [id, pw, salt, phone, name, type]
                 });
             }
             res.json({success: queryResult=='success'});
        });
    });
}));

// 로그인
router.post('/login', wrapper.asyncMiddleware( async (req, res, next) => {
    const id = req.body.id;
    const queryResult = await db.select({
        from: 'USER',
        what: ['*'],
        where: {
            ID: id,
        }
    });
    const pw = queryResult[0]['PW'];
    const salt = queryResult[0]['SALT'];
    crypto.pbkdf2(req.body.pw, salt, 100000, 64, 'sha512', async (err, key) => {
        if (key.toString('base64') == pw) {
            req.session.user_id = id;
            req.session.user_type = queryResult[0]['TYPE'];
            res.json({success: true});
        } else {
            res.json({success: false});
        }
    });
}));

// 로그아웃
router.get('/logout', wrapper.asyncMiddleware(async (req, res, next) => {
    delete req.session.user_id;
    delete req.session.user_type;
    res.redirect('/');
}));

// 회원정보 수정 - 프리랜서, 의뢰자
router.get('/modify', wrapper.asyncMiddleware(async (req,res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_modify.html'));
}));
// 회원정보 수정 - 관리자
router.get('/modify_admin', wrapper.asyncMiddleware(async(req,res,next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/admin_user_modify.html'));
}));




// 회원정보 가져오기 - 프리랜서, 의뢰자
router.post('/info', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    let queryResult = await db.select({
        from: 'USER',
        what: ['PHONE', 'NAME', 'TYPE', 'CAREER', 'AGE', 'MAJOR'],
        where: {
            ID: id
        }
    });
    const result = {};
    result['id'] = id;
    result['phone'] = queryResult[0]['PHONE'];
    result['name'] = queryResult[0]['NAME'];
    result['type'] = queryResult[0]['TYPE'];
    if (queryResult[0]['TYPE'] == 'freelancer') {
        result['career'] = queryResult[0]['CAREER'];
        result['age'] = queryResult[0]['AGE'];
        result['major'] = queryResult[0]['MAJOR'];
        queryResult = await db.select({
            from: 'F_ABILITY',
            what: ['LANGUAGE', 'COMPETENCE'],
            where: {
                F_ID: id
            }
        });
        result['language'] = [];
        result['competence'] = [];
        for (let i=0; i<queryResult.length; i++) {
            result['language'][i] = queryResult[i]['LANGUAGE'];
            result['competence'][i] = queryResult[i]['COMPETENCE'];
        }
    }
    res.json(result);
}));
//회원정보 가져오기 - 관리자 (회원정보 수정에서 사용)
router.post('/info/admin', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.body.user_id;
    let queryResult = await db.select({
        from: 'USER',
        what: ['PHONE', 'NAME', 'TYPE', 'CAREER', 'AGE', 'MAJOR'],
        where: {
            ID: id
        }
    });
    const result = {};
    result['id'] = id;
    result['phone'] = queryResult[0]['PHONE'];
    result['name'] = queryResult[0]['NAME'];
    result['type'] = queryResult[0]['TYPE'];
    if (queryResult[0]['TYPE'] == 'freelancer') {
        result['career'] = queryResult[0]['CAREER'];
        result['age'] = queryResult[0]['AGE'];
        result['major'] = queryResult[0]['MAJOR'];
        queryResult = await db.select({
            from: 'F_ABILITY',
            what: ['LANGUAGE', 'COMPETENCE'],
            where: {
                F_ID: id
            }
        });
        result['language'] = [];
        result['competence'] = [];
        for (let i=0; i<queryResult.length; i++) {
            result['language'][i] = queryResult[i]['LANGUAGE'];
            result['competence'][i] = queryResult[i]['COMPETENCE'];
        }
    }
    res.json(result);
}));

// 회원정보 수정 - 프리랜서, 의뢰자, 관리자
router.post('/modify', upload.single('portfolio'), wrapper.asyncMiddleware(async (req, res, next) => {
    const type = req.body.type;
    const id = req.body.id;
    const name = req.body.name;
    const phone = req.body.phone;
    if (req.body.pw) {
        crypto.randomBytes(64, (err, buf) => {
            crypto.pbkdf2(req.body.pw, buf.toString('base64'), 100000, 64, 'sha512', async (err, key) => {
                const pw = key.toString('base64');
                const salt = buf.toString('base64');
                let queryResult;
                if (type == 'freelancer') {
                    const age = req.body.age;
                    const career = req.body.career;
                    const major = req.body.major;
                    const language = req.body.language;
                    const competence = req.body.competence;
                    queryResult = await db.update({
                        table: 'USER',
                        set: {
                            PW: pw,
                            SALT: salt,
                            PHONE: phone,
                            NAME: name,
                            CAREER: career,
                            AGE: age,
                            MAJOR: major
                        },
                        where: {
                            ID: id
                        }
                    });
                    queryResult = await db.delete({
                        from: 'F_ABILITY',
                        where: {
                            F_ID: id
                        }
                    });
                    if (typeof language == 'object') {
                        for (let i = 0; i < language.length; i++) {
                            if (language[i]) {
                                queryResult = await db.insert({
                                    into: 'F_ABILITY',
                                    attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                                    values: [id, language[i], competence[i]],
                                });
                            }
                        }
                    } else {
                        if (language) {
                            queryResult = await db.insert({
                                into: 'F_ABILITY',
                                attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                                values: [id, language, competence],
                            });
                        }
                    }
                    if (req.file) {
                        queryResult = await db.delete({
                            from: 'OUTER_PORTFOLIO',
                            where: {
                                F_ID: id
                            }
                        })
                        const portfolio = '/public/upload/' + req.file.filename;
                        queryResult = await db.insert({
                            into: 'OUTER_PORTFOLIO',
                            attributes: ['F_ID', 'CONTENT'],
                            values: [id, portfolio]
                        })
                    }
                } else {
                    queryResult = await db.update({
                        table: 'USER',
                        set: {
                            PW: pw,
                            SALT: salt,
                            PHONE: phone,
                            NAME: name
                        },
                        where: {
                            ID: id
                        }
                    });
                }
                res.json({success: queryResult == 'success'});
            });
        });
    } else {
        let queryResult;
        if (type == 'freelancer') {
            const age = req.body.age;
            const career = req.body.career;
            const major = req.body.major;
            const language = req.body.language;
            const competence = req.body.competence;
            queryResult = await db.update({
                table: 'USER',
                set: {
                    PHONE: phone,
                    NAME: name,
                    CAREER: career,
                    AGE: age,
                    MAJOR: major
                },
                where: {
                    ID: id
                }
            });
            queryResult = await db.delete({
                from: 'F_ABILITY',
                where: {
                    F_ID: id
                }
            });
            if (typeof language == 'object') {
                for (let i = 0; i < language.length; i++) {
                    if (language[i]) {
                        queryResult = await db.insert({
                            into: 'F_ABILITY',
                            attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                            values: [id, language[i], competence[i]],
                        });
                    }
                }
            } else {
                if (language) {
                    queryResult = await db.insert({
                        into: 'F_ABILITY',
                        attributes: ['F_ID', 'LANGUAGE', 'COMPETENCE'],
                        values: [id, language, competence],
                    });
                }
            }
            if (req.file) {
                queryResult = await db.delete({
                    from: 'OUTER_PORTFOLIO',
                    where: {
                        F_ID: id
                    }
                })
                const portfolio = '/public/upload/' + req.file.filename;
                queryResult = await db.insert({
                    into: 'OUTER_PORTFOLIO',
                    attributes: ['F_ID', 'CONTENT'],
                    values: [id, portfolio]
                })
            }
        } else {
            queryResult = await db.update({
                table: 'USER',
                set: {
                    PHONE: phone,
                    NAME: name
                },
                where: {
                    ID: id
                }
            });
        }
        res.json({success: queryResult == 'success'});
    }
}));
// 회원정보 삭제 - 관리자
router.post('/delete_user', wrapper.asyncMiddleware(async(req,res,next)=>{
    const id = req.body.user_id;
    const queryResult = await db.delete({
        from : "USER",
        where : {ID : id}
    });
    res.json(queryResult);
}))

// 사용자 목록 페이지
router.get('/list', wrapper.asyncMiddleware(async (req, res, next)=> {
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_list.html'));
}));

// 사용자 목록 요청 - 전체보기, 프리랜서 보기, 의뢰인 보기
router.post('/list_all', wrapper.asyncMiddleware(async (req, res, next) => {
    const queryResult = await db.select({
        from: 'USER',
        what: ['*']
    });
    res.json(queryResult);
}));
router.post('/list_free', wrapper.asyncMiddleware(async(req,res,next) => {
    const queryResult = await db.select({
        from:'USER',
        what: ['*'],
        where: {TYPE : 'freelancer'}
    })
    res.json(queryResult)
}))
router.post('/list_client', wrapper.asyncMiddleware(async(req,res,next) =>{
    const queryResult = await db.select({
        from:'USER',
        what: ['*'],
        where: {TYPE : 'client'}
    })
    res.json(queryResult)
}))



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

// 프리랜서 포트폴리오 조회 페이지
router.get('/portfolio', wrapper.asyncMiddleware(async (req, res, next) => {
    res.type('html').sendFile(path.join(__dirname, '../public/html/user_portfolio.html'));
}));

// 프리랜서 내부 포트폴리오 조회
router.post('/inner_portfolio', wrapper.asyncMiddleware(async (req, res, next) => {
    const id = req.session.user_id;
    const queryResult = await db.select({
        from: 'REQUEST',
        what: ['TITLE', 'S_DATE', 'E_DATE', 'F_RATE', 'R_NUM'],
        where: {
            F_ID: id,
            STATE: 'complete'
        }
    });
    res.json(queryResult);
}));

module.exports = router;