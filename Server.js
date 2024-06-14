const dotenv = require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const sha = require('sha256');

const url = process.env.DB_URL;
let mydb;

MongoClient.connect(url)
    .then((client) => {
        mydb = client.db('myboard');
        console.log('Connected to MongoDB');

        // Express 서버 시작
        app.listen(process.env.PORT, function () {
            console.log("포트 8080으로 서버 대기중 ... ");
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.use(session({
    secret: 'dkufe8938593j4e08349u',
    resave: false,
    saveUninitialized: true
}));

// Multer 설정
let storage = multer.diskStorage({
    destination: function (req, file, done) {
        done(null, './public/image');
    },
    filename: function (req, file, done) {
        done(null, Date.now() + '-' + file.originalname);
    }
});

let upload = multer({ 
    storage: storage
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use('/', require('./routes/post.js'))
app.use('/', require('./routes/add.js'))
app.use('/', require('./routes/auth.js'))

app.get('/', async function (req, res) {
    try {
        const post_s = await mydb.collection('post').find().sort({ number: -1 }).limit(5).toArray();
        const report_s = await mydb.collection('report').find().sort({ number: -1 }).limit(5).toArray();
        const community_s = await mydb.collection('community').find().sort({ number: -1 }).limit(5).toArray();

        res.render('index.ejs', {
            user: req.session.user,
            posts: post_s,
            reports: report_s,
            communities: community_s
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
});