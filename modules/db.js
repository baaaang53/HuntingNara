'use strict';
const mysql = require('mysql');
const config = require('../config');
const connection = mysql.createPool(config.db);

// query
exports.getQueryResult = (sql) => {
    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log(rows);
                console.log('=====================================================');
                resolve(rows);
            });
        });
    });
};
// return = []


// select
// option = {
//     from: 'USER',
//     what: [
//         'ID',
//         'CAREER'
//         ],
//     where: {
//         NAME: 'john',
//         AGE: 21
//     }
// }
exports.select = (option) => {
    let sql = 'SELECT '
    for (const w of option.what) {
        sql += w + ', ';
    }
    if (option.where) {
        sql = sql.slice(0, -2) + ' FROM ' + option.from + ' WHERE ';
        for (const key in option.where) {
            sql += key + '="' + option.where[key] + '" AND ';
        }
        sql = sql.slice(0, -5) + ';';
    } else {
        sql = sql.slice(0, -2) + ' FROM ' + option.from + ';';
    }

    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if(err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log(rows);
                console.log('=====================================================');
                resolve(rows);
            });
        });
    });
};
// return = []


// insert
// option = {
//     into: 'USER',
//     attributes: ['ID', 'PW', 'NAME'],
//     values: ['abab', 'cdcd', 'efef']
// }
exports.insert = (option) => {
    let sql = 'INSERT INTO ' + option.into;
    if (option.attributes) {
        sql += '(';
        for (const attribute of option.attributes) {
            sql += attribute + ', ';
        }
        sql = sql.slice(0, -2) + ') VALUES (';
    }
    for (const value of option.values) {
        sql += '"' + value + '", ';
    }
    sql = sql.slice(0, -2) + ');';
    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log('success');
                console.log('=====================================================');
                resolve('success');
            });
        });
    });
};
// return = 'success'


// delete
// option = {
//     from: 'USER',
//     where: {'ID': 'keroro'}
// }
exports.delete = (option) => {
    let sql = 'DELETE ' + option.from + ' WHERE ';
    for (const w in option.where) {
        sql += w + ' = "' + option.where[w] + '" AND ';
    };
    sql = sql.slice(0, -5) + ';';
    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log('success');
                console.log('=====================================================');
                resolve('success');
            });
        });
    });
};
// return = 'success'


// update
// option = {
//     table: 'USER',
//     set: {'ID': 'keroro', 'NAME': 'john'},
//     where: {'AGE': 30}
// }
exports.update = (option) => {
    let sql = 'UPDATE ' + option.table + ' SET ';
    for (const s in option.set) {
        sql +=  s + ' = "' + option.set[s] + '", ';
    }
    sql = sql.slice(0, -2) + ' WHERE ';
    for (const w in option.where) {
        sql += w + ' = "' + option.where[w] + '" AND ';
    };
    sql = sql.slice(0, -5) + ';';
    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log('success');
                console.log('=====================================================');
                resolve('success');
            });
        });
    });
};
// return = 'success'

