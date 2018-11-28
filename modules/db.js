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
            if(err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log(rows[0]);
                console.log('=====================================================');
                resolve(rows[0]);
            });
        });
    });
};

// insert
// option = {
//     table: 'USER',
//     attributes: ['ID', 'PW', 'NAME'],
//     values: ['abab', 'cdcd', 'efef']
// }
exports.insert = (option) => {
    let sql = 'INSERT INTO ' + option.table;
    if (option.attributes) {
        sql += '(';
        for (const attribute of option.attributes) {
            sql += attribute + ', ';
        }
        sql = sql.slice(0, -2);
        sql += ')';
    }
    sql += ' VALUES (';
    for (const value of option.values) {
        sql += '"' + value + '", ';
    };
    sql = sql.slice(0, -2);
    sql += ');';
    console.log('==================== Query ==========================');
    console.log(sql);
    return new Promise( (resolve, reject) => {
        connection.getConnection((err, connection) => {
            if(err) return reject(err);
            connection.query(sql, (err, rows) => {
                connection.release();
                if (err) return reject(err);
                console.log('==================== QueryResult ====================');
                console.log(rows[0]);
                console.log('=====================================================');
                resolve(rows[0]);
            });
        });
    });
};


