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


const sha = require('sha256');
let session = require('express-session');
router.use(session({
    secret: 'dkufe8938593j4e08349u',
    resave: false,
    saveUninitialized: true
}));


router.get("/login", function (req, res) {
    console.log(req.session);
    if (req.session.user) {
        console.log('세션 유지');
        res.redirect('/');
    } else {
        res.render("login.ejs");
    }
});

router.post("/login", function (req, res) {
    console.log("아이디 : " + req.body.userid);
    console.log("비밀번호 : " + req.body.userpw);

    mydb.collection("account").findOne({ userid: req.body.userid })
        .then((result) => {
            if (result.userpw == sha(req.body.userpw)) {
                req.session.user = {
                    userid: result.userid,
                    usergroup: result.usergroup,
                    admin: result.admin || false,
                    manager: result.manager || false
                };
                console.log('새로운 로그인');
                res.redirect('/');
            } else {
                res.send("<script>alert('잘못된 비밀번호입니다.'); window.location.href='/login';</script>");
            }
        })
        .catch((err) => {
            res.send("<script>alert('없는 아이디입니다.'); window.location.href='/login';</script>");
        });
});

router.get("/logout", function (req, res) {
    console.log("로그아웃");
    req.session.destroy();
    res.redirect('/');
});

router.get("/signup", function (req, res) {
    res.render("signup.ejs", { user: req.session.user });
});

router.post('/signup', function (req, res) {
    console.log(req.body.userid);
    console.log(sha(req.body.userpw));
    console.log(req.body.usergroup);
    console.log(req.body.useremail);

    mydb.collection("account").insertOne({
        userid: req.body.userid,
        userpw: sha(req.body.userpw),
        usergroup: req.body.usergroup,
        useremail: req.body.useremail,
        admin: false,
        manager: false
    }).then(result => {
        console.log("회원가입 성공");
        res.redirect('/');
    });
});


module.exports = router;