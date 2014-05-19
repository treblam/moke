var express = require('express');
var router = express.Router();

var filter = require('../filter/filter');

var passport = require('passport');
var qqStrategy = require('passport-qq').Strategy;

var monk = require('monk');
var db = monk('localhost:27017/moke');

var users = db.get('users');

passport.use(new qqStrategy({
        clientID: '101093252',
        clientSecret: '4b7804cb290d2f71881a9e70a9df417c',
        callbackURL: "http://moke.com/auth/qq/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("accessToken: " + accessToken);
        console.log("refreshToken: " + refreshToken);
        console.log('profile: ');
        console.log(profile);

        users.findOne({openId: profile.provider + '_' + profile.id}, function(err, user) {
            if (err) {
                console.log('err is not null.');
                console.log(err);
                return done(err, user);
            }

            if (user == null) {
                users.insert({
                    openId: profile.provider + '_' + profile.id,
                    nickname: profile._json.nickname,
                    gender: profile._json.gender,
                    avatar: profile._json.figureurl
                }, function(err, user) {

                    if (user != null) {
                        console.log('user is not null. insert suc.');
                        console.log(user);
                    }

                    return done(err, user);
                });
            } else {
                console.log('user is not null. no insert.');
                console.log(user);
                return done(err, user);
            }

        });

        /*users.findAndModify({
            query: {openId: profile.provider + '_' + profile.id},
            update: {
                $setOnInsert: {
                        openId: profile.provider + '_' + profile.id,
                        nickname: profile._json.nickname,
                        gender: profile._json.gender,
                        avatar: profile.figureurl
                    }
                },
            new: true,
            upsert: true
        }, function(err, user) {

            console.log(err);

            return done(err, user);
        });*/

        /*User.findOrCreate({ qqId: profile.id }, function (err, user) {
            return done(err, user);
        });*/
    }
));

passport.serializeUser(function(user, done) {
    console.log('serialize. user.id: ');
    console.log(user._id);
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    users.findById(id, function(err, user) {
        done(err, user);
    });
});

/* GET home page. */
router.get('/', function(req, res) {
    console.log('user: ')
    console.log(req.user);

    console.log('session: ');
    console.log(req.session);
    console.log(req.user != null);
    res.render('index', { title: '首页', isLogined: req.user != null });
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

router.get('/read', filter.authorize, function(req, res) {
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

router.get('/write', filter.authorize, function(req, res) {
    res.render('write', {
        title: "写作"
    });
});

router.get('/userlist', filter.authorize, function(req, res) {
    var db = req.db;
    var users = db.get('users');
    users.find({}, {}, function(e, docs) {
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
    var users = db.get('users');

    var username = req.body.username;
    var email = req.body.useremail;

    users.insert({
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

router.get('/home/:uid', function(req, res) {
    var uid = req.param('uid');
    users.findById(uid, function(err, user) {
        if (err != null) {

        }

        // todo 要判断主人态，主人态要加编辑功能
        res.render('home', { title: "个人主页", user: user });
    })
})

router.get('/auth/qq',
    passport.authenticate('qq', {scope: 'get_user_info'})
);

router.get('/auth/qq/callback',
    passport.authenticate('qq', { successRedirect: '/', failureRedirect: '/signin' })
);

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

module.exports = router;