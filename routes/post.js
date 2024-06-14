var router = require('express').Router();

const { MongoClient, ObjectId } = require('mongodb');
const url = process.env.DB_URL;

let mydb;
MongoClient.connect(url)
    .then((client) => {
        mydb = client.db('myboard');
    })
    .catch((err) => {
        console.log(err);
    });

router.get('/list', async function (req, res) {
    try {
        const result = await mydb.collection('post').find().sort({ number: -1 }).toArray();
        res.render('list.ejs', { data: result, user: req.session.user });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching data');
    }
});

router.get('/report', async function (req, res) {
    try {
        const result = await mydb.collection('report').find().sort({ number: -1 }).toArray();
        res.render('report.ejs', { data: result, user: req.session.user });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching data');
    }
});

router.get('/community', async function (req, res) {
    try {
        const result = await mydb.collection('community').find().sort({ number: -1 }).toArray();
        res.render('community.ejs', { data: result, user: req.session.user });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching data');
    }
});



module.exports = router;