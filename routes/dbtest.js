const { createClient } = require('@supabase/supabase-js');
var express = require('express');
var createError = require('http-errors');
var router = express.Router();

module.exports = router;

router.get('/test', async (req, res, next) => {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_KEY
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase
            .from('countries')
            .select()
        if (error) throw error
        res.json(data)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "An error occurred" })
    }
})