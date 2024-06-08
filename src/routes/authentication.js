const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
// const pool = require('../models/db')

router.post('/Salary', controller.salary_slip);
router.post('/Salaryupdate', controller.salary_slip_update);
router.post('/Salarydelete', controller.salary_slip_delete);


module.exports = router;
