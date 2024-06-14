var router = require('express').Router();

const { MongoClient, ObjectId } = require('mongodb');
const url = process.env.DB_URL;

let mydb;
let post_no = 0;
let report_no = 0;
let community_no = 0;

MongoClient.connect(url)
    .then((client) => {
        mydb = client.db('myboard');

        // 최근 게시글 번호 가져오기
        mydb.collection('post').find().sort({ number: -1 }).limit(1).toArray()
            .then(posts => {
                if (posts.length > 0) {
                    post_no = posts[0].number;
                }
            });

        mydb.collection('report').find().sort({ number: -1 }).limit(1).toArray()
            .then(posts => {
                if (posts.length > 0) {
                    report_no = posts[0].number;
                }
            });

        mydb.collection('community').find().sort({ number: -1 }).limit(1).toArray()
            .then(posts => {
                if (posts.length > 0) {
                    community_no = posts[0].number;
                }
            });
    })
    .catch((err) => {
        console.log(err);
    });


const multer = require('multer');
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


router.get('/enter', function (req, res) {
    const target = req.query.target || 'post';
    res.render('enter.ejs', { user: req.session.user, target: target });
});

router.post('/save', upload.single('picture'), async function (req, res) {
    console.log(req.body.title);
    console.log(req.body.content);
    console.log(req.body.someDate);
    console.log(req.file); // 업로드된 파일 정보
    console.log(req.session.user); // 디버깅용 로그 추가

    let imagePath = '';
    if (req.file) {
        imagePath = '/image/' + req.file.filename;
    }

    let number;

    const targetCollection = req.body.target === 'community' ? 'community' : (req.body.target === 'report' ? 'report' : 'post');
    let page;

    if (targetCollection == 'community') {
        community_no++;
        number = community_no;
        page = '/community';
    }
    else if (targetCollection == 'post'){
        post_no++;
        number = post_no;
        page = '/list';
    }
    else {
        report_no++;
        number = report_no;
        page = '/report';
    }

    // 오늘 날짜
    const currentDate = new Date().toISOString().split('T')[0];

    // 몽고DB에 데이터 저장하기
    await mydb.collection(targetCollection)
        .insertOne({
            number: number,
            title: req.body.title,
            content: req.body.content,
            date: currentDate,
            path: imagePath,
            userid: req.session.user.userid,
            usergroup: req.session.user.usergroup
        })
        .then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
            res.redirect(page);
        });
});

router.post("/delete", function (req, res) {
    console.log(req.body._id);
    if (!ObjectId.isValid(req.body._id)) {
        return res.status(400).send('Invalid ObjectId');
    }
    const objectId = new ObjectId(req.body._id);

    const targetCollection = req.body.target === 'community' ? 'community' : (req.body.target === 'report' ? 'report' : 'post');
    let page = targetCollection === 'community' ? '/community' : (targetCollection === 'post' ? '/list' : '/report');

    mydb.collection(targetCollection).deleteOne({ _id: objectId })
        .then(result => {
            console.log('삭제완료');
            console.log(targetCollection);
            res.redirect(page);
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/content/:id', function (req, res) {
    console.log(req.params.id);
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send('Invalid ObjectId');
    }

    const target = req.query.target || 'post';
    const targetCollection = target === 'community' ? 'community' : (target === 'post' ? 'post' : 'report');

    req.params.id = new ObjectId(req.params.id);
    mydb.collection(targetCollection).findOne({ _id: req.params.id })
        .then((result) => {
            if (!result) {
                return res.status(404).send('Post not found');
            }
            console.log(result);
            res.render("content.ejs", { data: result, user: req.session.user, target: target });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send('Internal server error');
        });
});

router.get("/edit/:id", function (req, res) {
    console.log(req.params.id);
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send('Invalid ObjectId');
    }

    const target = req.query.target || 'post';
    const targetCollection = target === 'community' ? 'community' : (target === 'post' ? 'post' : 'report');

    req.params.id = new ObjectId(req.params.id);
    mydb.collection(targetCollection).findOne({ _id: req.params.id })
        .then((result) => {
            console.log(result);
            res.render("edit.ejs", { data: result, user: req.session.user, target : target });
        });
});

router.post("/edit", upload.single('picture'), function (req, res) {
    console.log(req.body);
    if (!ObjectId.isValid(req.body.id)) {
        return res.status(400).send('Invalid ObjectId');
    }
    req.body.id = new ObjectId(req.body.id);
    const currentDate = new Date().toISOString().split('T')[0];
    const targetCollection = req.body.target === 'community' ? 'community' : (req.body.target === 'post' ? 'post' : 'report');
    let page = targetCollection ==='community' ? '/community' : (targetCollection === 'post' ? '/list' : '/report');

    let updateData = {
        title: req.body.title,
        content: req.body.content,
        date: currentDate
    };

    if (req.file) {
        updateData.path = '/image/' + req.file.filename;
    }

    mydb.collection(targetCollection).updateOne({ _id: req.body.id }, { $set: updateData })
        .then((result) => {
            console.log("수정완료");
            console.log(targetCollection);
            console.log(page);
            res.redirect(page);
        })
        .catch((err) => {
            console.log(err);
        });
});

module.exports = router;