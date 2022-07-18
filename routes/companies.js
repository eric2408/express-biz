const db = require("../db");
const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const slugify = require("slugify");

router.get('', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({'companies': results.rows});
    } catch (error) {
        return next(error);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        const results = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`No company found at: ${code}` , 404);
        }
        const invo = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code])

        let companies = results.rows[0];
        let invoices = invo.rows;

        companies.invoices = invoices.map(inv => inv.id);

        return res.json({'company': companies})
    } catch (error) {
        return next(error)
    }
});


router.post('', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true});

        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)
                                        RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({'company': results.rows[0]});
    } catch (error) {
        return next(error);
    }
});

router.patch('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;
        let {name, description} = req.body;

        const results = await db.query(`UPDATE companies SET name=$1, description=$2
                                        WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        if(results.rows.length === 0){
            throw new ExpressError(`No company found at: ${code}` , 404);
        }



        return res.json({"company": results.rows[0]});
    } catch (error) {
        return next(error)
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`No company found at: ${code}` , 404);
        }

        return res.json({"status": "deleted"});
    } catch (error) {
        return next(error)
    }
});

module.exports = router;