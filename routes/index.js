var express = require('express');
var router = express.Router();

var filter = require('../filter/filter');

var passport = require('passport');
var qqStrategy = require('passport-qq').Strategy;

var monk = require('monk');
var db = monk('localhost:27017/moke');

var users = db.get('users');

var articles = db.get('articles');

var collections = db.get('collections');

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

        users.findOne({openId: profile.id}, function(err, user) {
            if (err) {
                console.log('err is not null.');
                console.log(err);
                return done(err, user);
            }

            if (user == null) {
                users.insert({
                    openId: profile.id,
                    provider: profile.provider,
                    nickname: profile._json.nickname,
                    gender: profile._json.gender,
                    avatar: profile._json.figureurl,
                    intro: '',
                    collFollowing: [],
                    userFollowing: [],
                    interests: []
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
    console.log('user: ');
    console.log(req.user);

    console.log('session: ');
    console.log(req.session);
    console.log(req.user != null);
    res.render('index', { title: '首页', user: req.user });
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
    var db = req.db;
    var articles = db.get('articles');

    articles.find({}, function(err, articles) {
        if (err) {

        } else {
            findAuthorsForArticles(articles, function(arts) {
                res.render('read', {
                    title: "杂志",
                    articles: arts,
                    user: req.user
                });
            });
        }
    });
});

function findAuthorsForArticles(articles, callback) {
    var count = 0;

    if (!articles || articles.length == 0) {
        callback(articles);
    }

    articles.forEach(function(article, index) {
        console.log('forEach article: ');
        console.log(article);

        var authorId = article.author;
        var users = db.get('users');


        users.findById(authorId, function(err, author) {
            count++;
            if (err) {

            } else {
                article.author = author;
                console.log('author found:');
                console.log(author);
            }

            // 如果已经循环完毕了
            if (count == articles.length) {
                callback(articles);
            }
        })
    });
}

router.get('/article/:articleId', function(req, res) {
    var articleId = req.param('articleId');

    var db = req.db;
    var articles = db.get('articles');
    var users = db.get('users');

    console.log('articleId: ');
    console.log(articleId);

    articles.findById(articleId, function(err, article) {
        if (err) {

        } else {
            console.log('found article:');
            console.log(article);
            users.findById(article.author, function(err, user) {
                if (err) {

                } else {
                    console.log('found user: ');
                    console.log(user);

                    article.author = user;
                    res.render('article', {
                        article: article,
                        user: req.user
                    });
                }
            })
        }
    });
});

router.delete('/article', function(req, res) {
    var articleId = req.body.articleId;

    articles.remove({_id: articles.id(articleId)}, function(err) {
        if (err) {
            // res.send(err);
        }

        // res.redirect('/home/' + req.user._id);

        console.log('articleId: ');
        console.log(articleId);

        console.log('remove article err:')
        console.log(err);

        articles.findById(articleId, function(err, article) {
            console.log('article after remove: ');
            console.log(article);
        })

        res.json({ status: 'success', data: null });
    })


});

router.get('/about', function(req, res) {
    res.render('about', {
        title: "关于"
    });
});

router.get('/write/:articleId?', filter.authorize, function(req, res) {

    var articleId = req.param('articleId');
    if (articleId) {
        articles.findById(articleId, function(err, article) {
            if (err) {

            } else {
                res.render('write', {
                    title: '写作',
                    article: article,
                    user: req.user
                })
            }
        });

    } else {
        console.log('no article id, user: ');
        console.log(req.user);
        res.render('write', {
            title: "写作",
            user: req.user
        });
    }

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
        title: '登录'
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
    console.log('uid: ');
    console.log(uid);

    users.findById(uid, function(err, user) {
        if (err != null) {

        } else {
            articles.find({ author: articles.id(uid) }, function(err, docs) {
                if (err) {

                } else {
                    console.log('user articles: ');
                    console.log(docs);

                    // todo 要判断主人态，主人态要加编辑功能
                    res.render('home', {
                        title: "个人主页",
                        user: user,
                        articles: docs
                    });
                }
            });
        }

    })
});

function include(arr, obj) {
    return arr.some(function(item) {
        return item.toString() == obj;
    });
}

router.get('/collections', function(req, res) {

    collections.find({}, function(err, colls) {
        if (err) {

        } else {

            var user = req.user;

            colls.forEach(function(collection, index) {
                collection.isFollowing = user.collFollowing && include(user.collFollowing, collection._id.toString());
            });

            res.render('collections', {
                title: '文集',
                collections: colls,
                user: user
            });
        }
    });
});

router.get('/collection/:collectionId', function(req, res) {
    var collId = req.param('collectionId');

    collections.findById(collId, function(err, coll) {
        if (err) {

        } else {
            if (!coll) {
                console.log('未找到指定的文集');
                res.send('未找到指定的文集');
                return;
            }
            var user = req.user;
            coll.isFollowing = user.collFollowing && include(user.collFollowing, collId);

            // 根据文集的id来找文章，todo: 这样写可以吗
            articles.find({collections: collections.id(collId)}, function(err, arts) {
                if (err) {

                } else {
                    findAuthorsForArticles(arts, function(newArticles) {
                        coll.articles = newArticles;
                        res.render('collection', {
                            title: '文集',
                            user: req.user,
                            collection: coll
                        });
                    });
                }
            });
        }
    });
});

router.get('/edit_collection/:collId?', filter.authorize, function(req, res) {

    var collId = req.param('collId');

    if (collId) {
        collections.findById(collId, function(err, coll) {
            if (err) {
                res.send(err);
            } else {
                if (coll) {
                    res.render('edit_collection', {
                        title: '编辑文集',
                        collection: coll,
                        user: req.user
                    })
                } else {
                    res.send('未找到指定文集');
                }
            }

        });
    } else {
        res.render('edit_collection', {
            title: '创建文集'
        });
    }
});

router.post('/collection', filter.authorize, function(req, res) {

    var collId = req.body.collId;

    console.log('get collId from request body, collId is: ' + collId);

    var isInsert = false;

    if (!collId) {
        console.log('collId is empty, start to generate new Id');
        collId = collections.id();

        console.log('new collId is: ' + collId);

        isInsert = true;
    } else {
        console.log(collId);
    }

    collections.findAndModify({_id: collId}, {$set: {
        name: req.body.name,
        intro: req.body.intro,
        creator: req.user._id
    }}, {upsert: true}, function(err, coll) {
        if (err) {

        } else {
            if (isInsert) { // 如果是创建，直接让创建人订阅上改文集
                users.findAndModify({_id: req.user._id}, {
                    $addToSet: {
                        collFollowing: coll._id
                    }
                }, function(err, user) {
                    if (err) {
                        res.send(err);
                        return;
                    } else {
                        console.log('after created collection, user: ');
                        console.log(user);

                        console.log('req.user: ');
                        console.log(req.user);

                        if (user) {
                            //req.user = user;
                        }
                        res.redirect('/collection/' + collId);
                    }
                });
            } else { // 如果是编辑，直接跳转
                res.redirect('/collection/' + collId);
            }
        }
    });
    // res.render('', )
});

router.delete('/collection', filter.authorize, function(req, res) {
    var collId = req.body.collId;

    if (!collId) {
        res.json({
            status: 'fail',
            message: '文集id为空，无法删除'
        });
    }

    collections.remove({ _id: collId }, function(err) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });
        } else {
            res.json({
                status: 'success',
                data: null
            })
        }
    });
});

router.get('/coll_subscribe', filter.authorize, function(req, res) {

    var collId = req.query['collId'];

    if (!collId) {
        res.json({
            status: 'fail',
            message: '文集id为空，无法订阅'
        });

        return;
    }

    console.log('subscribe collId: ');
    console.log(collId);

    users.findAndModify({_id: req.user._id}, {
        $addToSet: {
            collFollowing: users.id(collId)
        }
    }, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: '订阅文集出错',
                data: err
            });

            return;
        }

        if (count < 1) {
            res.json({
                status: 'fail',
                data: null,
                message: '订阅文集失败'
            });
        } else {
            res.json({
                status: 'success',
                message: '订阅成功',
                data: {
                    isFollowing: true
                }
            });
        }
    });
});

router.get('/coll_unsubscribe', filter.authorize, function(req, res) {
    var collId = req.query['collId'];

    if (!collId) {
        res.json({
            status: 'fail',
            message: '文集id为空，无法订阅'
        });

        return;
    }

    console.log('unsubscribe collid: ');
    console.log(collId);

    users.update({_id: req.user._id}, {
        $pull: {
            collFollowing: users.id(collId)
        }
    }, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: '退订文集出错',
                data: err
            });

            return;
        }

        if (count < 1) {
            res.json({
                status: 'fail',
                message: '退订文集失败',
                data: null
            });
        } else {
            res.json({
                status: 'success',
                message: '退订成功',
                data: {
                    isFollowing: false
                }
            });
        }
    });
});

router.get('/auth/qq',
    passport.authenticate('qq', {scope: 'get_user_info'})
);

router.get('/auth/qq/callback',
    passport.authenticate('qq', { successRedirect: '/read', failureRedirect: '/signin' })
);

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

router.post('/article', filter.authorize, function(req, res) {

    var title = req.body.title;
    var subtitle = req.body.subtitle;
    var content = req.body.content;
    var articleId = req.body.articleId;

    var articleData = {
        title: title,
        subtitle: subtitle,
        content: content,
        author: req.user._id
    };

    console.log('post to write, articleId: ' + articleId);

//    if (articleId) {
        console.log('start to update.');
        if (!articleId) { // 没有articleId表示要新建一个
            articleId = articles.id();
        }
        articles.findAndModify({_id: articleId}, {$set: articleData}, {upsert: true}, function(err, count) {
            if (err) {

            } else {
                console.log('articleId: ' + articleId);
//                console.log('new articleId: ' + article._id);
                /*if (count == 1) { // 如果是编辑
                    res.redirect('/article/' + article._id);
                } else */
                //if {
                    res.redirect('/article/' + articleId);
//                }
            }
        });
    /*} else {
        articles.insert(articleData, function(err, article) {de
            if (err) {

            } else {
                console.log('article: ');
                console.log(article);

                res.redirect('/article/' + article._id);
            }
        });
    }*/


});

router.get('/myarticles', filter.authorize, function(req, res) {
    var uid = req.user._id;
    console.log('get myarticles, uid: ' + uid);

    var collId = req.query.collId;

    if (!collId) {
        res.send('缺少文集id');
    }

    articles.find({author: uid}, function(err, articles) {

        articles.forEach(function(article, index) {
            article.isContributed = article.collections && include(article.collections, collId);
        });

        res.app.render('myarticles', {
            articles: articles,
            collId: collId
        }, function(err, html) {
            console.log('get my articles html: ');
            console.log(html);
            res.send(html);
        })
    });
});

router.get('/contribute', filter.authorize, function(req, res) {
    var articleId = req.query.articleId;
    var collId = req.query.collId;

    if (!articleId || !collId) {
        res.json({
            status: 'fail',
            message: '文章id或文集id为空，无法添加'
        });
        return;
    }

    console.log('articleId: ' + articleId);
    console.log('collId: ' + collId);

    articles.findAndModify({_id: articleId}, {
        $addToSet: {
            collections: collections.id(collId)
        }
    },{new: true}, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString(),
                data: err
            });
        } else {

            console.log('after contribute, article is: ');
            console.log(count);

            //if (count > 0) {
                res.json({
                    status: 'success',
                    data: {
                        isContributed: true
                    }
                });
            /*} else {
                res.json({
                    status: 'fail',
                    data: null
                });
            }*/
        }
    })
});

router.get('/decontribute', filter.authorize, function(req, res) {
    var articleId = req.query.articleId;
    var collId = req.query.collId;

    if (!articleId || !collId) {
        res.json({
            status: 'fail',
            message: '文章id或文集id为空，无法添加'
        });
        return;
    }

    articles.update({_id: articleId}, {
        $pull: {
            collections: collections.id(collId)
        }
    }, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString(),
                data: err
            });
        } else {
            if (count > 0) {
                res.json({
                    status: 'success',
                    message: '删除成功',
                    data: {
                        isContributed: false
                    }
                });
            } else {
                res.json({
                    status: 'fail',
                    message: '删除失败',
                    data: null
                });
            }
        }
    });
});

module.exports = router;