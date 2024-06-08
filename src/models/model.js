// const { object } = require('joi');
const { query } = require('express');
const { TABLENAMES, ERRORMESSAGES, MESSAGES } = require('../../config/config');
const mysql = require('mysql');
const axios = require('axios');

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "test3",
    connectionLimit: 10,
});

const insertQuery = (tableName, data) => {
    return new Promise((resolve, reject) => {
        // console.log(data)
        const { Employee_id, Salary_date } = data;

        const year = new Date(Salary_date).getFullYear();
        const month = new Date(Salary_date).getMonth() + 1;
        // console.log(year, month,"========>")

        pool.query(
            `SELECT Employee_id FROM ${tableName} WHERE Employee_id = ? AND YEAR(Salary_date) = ? AND MONTH(Salary_date) = ?`,
            [Employee_id, year, month],
            (err, result) => {
                if (err) {
                    return reject(err + ERRORMESSAGES.DB_QUERY_ERROR);
                }
                if (result.length > 0) {
                    return reject(new Error(ERRORMESSAGES.DATA_ALREADY_EXISTS));
                }
                

                const keys = Object.keys(data);
                const columns = keys.join(', ');
                const placeholders = keys.map(() => '?').join(', ');
                const values = Object.values(data);
                const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) `;
                // console.log(sql)
                pool.query(sql, values, (err, result) => {
                    if (err) {
                        return reject(err + ERRORMESSAGES.DB_QUERY_ERROR);
                    }
                    resolve(result + MESSAGES.DATA_ENTERED);
                });
            }
        );
    });
};

const selectsalaryQuery = (tableName, data) => {
    let values = data.Employee_id
    const sql = `SELECT salary FROM ${tableName} WHERE Employee_Id=? `;

    return new Promise((resolve, reject) => {
        pool.query(sql, values, (err, result) => {
            if (err) {
                return reject(err);
            } if(result.length<= 0){
                return reject(new Error(ERRORMESSAGES.USER_NOT_FOUND));
            }
            else {
                // console.log(result[0].salary);
                resolve(result[0].salary);
            }
        });
    });
}


async function UpdateQuery(tableName, data) {
    console.log(data)
    const { Employee_id, Salary_date, ...fieldsToUpdate } = data;
    const year = new Date(Salary_date).getFullYear();
    const month = new Date(Salary_date).getMonth() + 1;
    let updateFields = [];
    let updateParams = [];


    for (const field in fieldsToUpdate) {
        if (fieldsToUpdate[field] !== undefined) {
            updateFields.push(`${field}=?`);
            updateParams.push(fieldsToUpdate[field]);
        }
    }

    updateParams.push(Employee_id);
    updateParams.push(year);
    updateParams.push(month);
    const sql = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE Employee_id=? AND YEAR(Salary_date) = ? AND MONTH(Salary_date) = ?`;

    return new Promise((resolve, reject) => {
        pool.query(sql, updateParams, (err, result) => {
            if (err) {
                // console.error(ERRORMESSAGES.DB_QUERY_ERROR, err);
                reject(err);
            } else if (result.changedRows === 0) {
                reject(ERRORMESSAGES.NO_CHANGE);
            } else {
                // console.log(MESSAGES.DATA_UPDATED);
                resolve(result);
            }
        });
    });
}

const deleteQuery = async (tableName, id, date) => {
    const year = new Date(date).getFullYear();
    const month = new Date(date).getMonth() + 1;
    const deleteParams = [id, year, month];
    const sql = `DELETE FROM ${tableName} WHERE Employee_id=? AND YEAR(Salary_date)=? AND MONTH(Salary_date)=?`;
    
    return new Promise((resolve, reject) => {
        pool.query(sql, deleteParams, (err, result) => {
            if (err) {
                console.error(ERRORMESSAGES.DB_QUERY_ERROR, err);
                reject(err);
            } else if (result.affectedRows === 0) {
                reject(new Error(ERRORMESSAGES.NO_CHANGE));
            } else {
                resolve(result);
            }
        });
    });
};


async function selectQuery(id, date) {
    return new Promise((resolve, reject) => {
        const query = `SELECT DATE_FORMAT(Salary_date, '%Y-%m-%d') AS Salary_date, salary_slip.Employee_id, Name, Salary, Deduction, FinalSalary 
                       FROM salary_slip INNER JOIN employee ON salary_slip.Employee_id = employee.Employee_id 
                       WHERE salary_slip.Employee_id = ? AND Salary_date = ? ORDER BY Salary_date, salary_slip.Employee_id`;

        pool.query(query, [id, date], (err, result) => {
            if (err) {
                console.error(ERRORMESSAGES.DB_QUERY_ERROR, err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
module.exports = {
    insertQuery,
    UpdateQuery,
    selectsalaryQuery,
    deleteQuery,
    selectQuery

};

