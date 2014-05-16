var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Get less css
/*router.get("*.less", function(req, res) {
    var path = __dirname + req.url;
    fs.readFile(path, "utf8", function(err, data) {
        if (err) throw err;
        less.render(data, function(err, css) {
            if (err) throw err;
            res.header("Content-type", "text/css");
            res.send(css);
        });
    });
});*/

router.get('/read', function(req, res) {
    res.render('read', {
        title: "杂志"
    });
});

router.get('/article', function(req, res) {
    res.render('article', {
        title: "文章"
    });
});

router.get('/about', function(req, res) {
    res.render('about', {
        title: "关于"
    });
});

router.get('/write', function(req, res) {
    res.render('write', {
        title: "写作"
    });
});

router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({}, {}, function(e, docs) {
        res.render('userlist', {
            "userlist": docs
        })
    })
});

router.get('/signin', function(req, res) {


    res.render('signin', {
        title: 'Add new user.'
    });
});

router.post('/signin', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');

    var username = req.body.username;
    var email = req.body.useremail;

    collection.insert({
        username: username,
        email: email
    }, function(err, doc) {
        if (err) {
            res.send('There was a problem adding the data to the database.')
        } else {
            res.location('userlist');
            res.redirect('/userlist');
        }
    });
});

router.get('/userhome', function(req, res) {
    res.render('userhome', {title: "个人中心"});
})

module.exports = router;