const { ERRORMESSAGES, TABLENAMES, MESSAGES } = require('../../config/config');
const model = require('../models/model');


const { google } = require('googleapis');
require('dotenv').config();

const fs = require('fs');
const { JWT } = require('google-auth-library')

let serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});
const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('1OMjencBfj3NzrrkgszJANzoLOGN5aeEgWoRVmUX6-IE', serviceAccountAuth);


async function fetchSheetData(data) {
    const { Salary_date } = data;
    await doc.loadInfo();

    const now = new Date(Salary_date);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const sheetName = `${year}-${('0' + month).slice(-2)}`;
    let sheet = doc.sheetsByTitle[sheetName];

    const rows = await sheet.getRows();
    let employeeIds = [];
    let totalsalary = 0;
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowData = row._rawData;
        const employeeId = rowData[sheet.headerValues.indexOf('FinalSalary')];
        employeeIds.push(employeeId);
        totalsalary += parseFloat(employeeId);
    }

    console.log(totalsalary)
}

const addRow = async (rows, date) => {
    try {
        await doc.loadInfo();

        const now = new Date(date);
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const sheetName = `${year}-${('0' + month).slice(-2)}`;
        let sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
            sheet = await doc.addSheet({ title: sheetName, headerValues: ['Salary_date', 'Employee_id', 'Name', 'Salary', 'Deduction', 'FinalSalary'] });
        }

        await sheet.addRows(rows);
    } catch (e) {
        console.log(e);
    }
};

const create = async (id, date) => {
    try {
        let result = await model.selectQuery(id, date);
        await addRow(result, date);
    } catch (error) {
        console.error('An error occurred while adding rows:', error);
    }
};
const salary_slip = async (req, res) => {
    const { data } = req.body;
    if (!data) {
        return res.status(400).json({ error: ERRORMESSAGES.DATA_ERROR });
    }

    try {
        let salary = await model.selectsalaryQuery(TABLENAMES.EMPLOYEE, data);
        let finalsalary = salary - data.Deduction

        const formattedSalaryDate = data.salarydate;
        let salary_slip_data = {
            Employee_id: data.Employee_id,
            Deduction: data.Deduction,
            FinalSalary: finalsalary,
            Salary_date: formattedSalaryDate
        };
        const result = await model.insertQuery(TABLENAMES.SALARY, salary_slip_data);
        await create(data.Employee_id, formattedSalaryDate)
        await fetchSheetData(salary_slip_data)

        res.status(200).json({ message: MESSAGES.DATA_ENTERED, result });
    } catch (err) {
        res.status(500).json({ error: ERRORMESSAGES.DB_QUERY_ERROR + err });
    }
};

const deleteRow = async (id, date) => {
    const key = 'Employee_id';

    try {
        await doc.loadInfo();

        const now = new Date(date);
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const sheetName = `${year}-${('0' + month).slice(-2)}`;
        let sheet = doc.sheetsByTitle[sheetName];
        // console.log(sheetName)
        if (!sheet) {
            console.log(ERRORMESSAGES.INVALID_CREDENTIAL);
            throw new Error(ERRORMESSAGES.INVALID_CREDENTIAL);
        }

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];

            const rowData = row._rawData;
            const rowdata = rowData[sheet.headerValues.indexOf('Employee_id')];

            if (rowdata === id) {
                await row.delete();
                console.log(`Deleted row with ${key}=${id}`);
                break;
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const salary_slip_delete = async (req, res) => {
    const { data } = req.body;

    if (!data || !data.Employee_id || !data.salarydate) {
        return res.status(400).json({ error: ERRORMESSAGES.DATA_ERROR });
    }
    const { Employee_id, salarydate } = data;
    const formattedSalaryDate = salarydate;

    let salary_slip_data = {
        Salary_date: formattedSalaryDate
    };

    try {
        const result = await model.deleteQuery(TABLENAMES.SALARY, Employee_id, salarydate);

        await deleteRow(Employee_id, salarydate);
        await fetchSheetData(salary_slip_data)

        res.status(200).json({ message: MESSAGES.DATA_DELETED, result });
    } catch (err) {
        console.error(ERRORMESSAGES.DB_QUERY_ERROR, err);
        res.status(500).json({ error: ERRORMESSAGES.DB_QUERY_ERROR + err.message });
    }
};


const updateRow = async (data) => {
    const { Employee_id, Salary_date, ...fieldsToUpdate } = data;
    try {
        await doc.loadInfo();

        const now = new Date(Salary_date);
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const sheetName = `${year}-${('0' + month).slice(-2)}`;
        let sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
            console.log(ERRORMESSAGES.INVALID_CREDENTIAL);
            throw new Error(ERRORMESSAGES.INVALID_CREDENTIAL);
        }

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const rowData = row._rawData;
            const rowdata = rowData[sheet.headerValues.indexOf('Employee_id')];

            if (rowdata === Employee_id) {
                for (let [key, value] of Object.entries(fieldsToUpdate)) {

                    if (sheet.headerValues.includes(key)) {
                        rowData[sheet.headerValues.indexOf(key)] = value;
                    }
                }
                await row.save();
                break;
            }
        }
    } catch (e) {
        console.log(e);
    }
};
const salary_slip_update = async (req, res) => {
    const { data } = req.body;

    if (!data) {
        return res.status(400).json({ error: ERRORMESSAGES.DATA_ERROR });
    }

    try {
        let salary = await model.selectsalaryQuery(TABLENAMES.EMPLOYEE, data);
        let finalsalary = salary - data.Deduction
        let salary_slip_data = {
            Employee_id: data.Employee_id,
            Deduction: data.Deduction,
            FinalSalary: finalsalary,
            Salary_date: data.salarydate

        };
        const result = await model.UpdateQuery(TABLENAMES.SALARY, salary_slip_data);
        await updateRow(salary_slip_data)
        await fetchSheetData(salary_slip_data)
        res.status(200).json({ message: MESSAGES.DATA_UPDATED, result });
    } catch (err) {
        res.status(500).json({ error: ERRORMESSAGES.DB_QUERY_ERROR + err });
    }
};


module.exports = {
    salary_slip,
    salary_slip_delete,
    salary_slip_update,
    updateRow,
    deleteRow
};
