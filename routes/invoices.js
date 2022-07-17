const db = require("../db");
const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();

router.get('', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({'companies': results.rows});
    } catch (error) {
        return next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id

        const results = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description FROM invoices AS i 
                                        INNER JOIN companies as c ON (i.comp_code = c.code) WHERE id = $1`, [id]);
        if(results.rows.length === 0){
            throw new ExpressError(`No invoice found at: ${id}` , 404);
        }
        
        let info = results.rows[0];
        let invoices = {
            invoice: {
                id: info.id,
                amt: info.amt,
                paid: info.paid,
                add_date: info.add_date,
                paid_date: info.paid_date,
                company: {
                    code: info.code,
                    name: info.name,
                    description: info.description
                }
            }
        }

        return res.json({'company': invoices})
    } catch (error) {
        return next(error)
    }
});


router.post('', async (req, res, next) => {
    try {
        let {comp_code, amt} = req.body;

        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);

        return res.status(201).json({'invoice': results.rows[0]});
    } catch (error) {
        return next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;
        let {amt, paid} = req.body;
        let paidDate = null;

        const currResult = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [id])

        if(currResult.rows.length === 0){
            throw new ExpressError(`No invoice found at: ${id}` , 404);
        }

        const currPaid_date = currResult.row[0].paid_date;

        if(!currPaid_date && paid){
            paidDate = new Date();
        } else if (!paid){
            paidDate = null;
        } else {
            paidDate = currPaid_date;
        }

        const results = await db.query(`UPDATE invoices SET amt= $1, paid=$2, paid_date=$3
                                        WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paidDate, id]);

        return res.json({'invoice': results.rows[0]})
    } catch (error) {
        return next(error)
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;

        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
        if(results.rows.length === 0){
            throw new ExpressError(`No invoice found at: ${id}` , 404);
        }

        return res.json({status: 'deleted'})
    } catch (error) {
        return next(error)
    }
});

module.exports = router;