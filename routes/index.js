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
        callbackURL: 'http://www.moke.io/auth/qq/callback'
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("accessToken: " + accessToken);
        console.log("refreshToken: " + refreshToken);
        console.log('profile: ');
        console.log(profile);

        /*users.findOne({openId: profile.id, provider: profile.provider}, function(err, user) {
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

        });*/

        users.findAndModify(
            {
                openId: profile.id,
                provider: profile.provider
            },
            {
                $set: {
                    avatar_s: profile._json.figureurl,
                    avatar_m: profile._json.figureurl_1,
                    avatar_l: profile._json.figureurl_2
                },
                $setOnInsert: {
                    openId: profile.id,
                    provider: profile.provider,
                    nickname: profile._json.nickname,
                    gender: profile._json.gender,
                    intro: '',
                    collFollowing: [],
                    userFollowing: [],
                    interests: []
                }
            },
            {
                new: true,
                upsert: true
            },
            function(err, user) {
                if (err) {
                    console.log('findAndModify user, error ocurred: ');
                    console.log(err);
                } else {
                    console.log('Login, user is: ');
                    console.log(user);
                }

                return done(err, user);
            }
        );
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

router.get('/read', function(req, res) {
    var db = req.db;
    var articles = db.get('articles');
    var user = req.user;
    var query;

    console.log(1);

    if (user == null) {
        query = {};
        console.log(2);
    } else {
        var following = user.userFollowing.push(user._id); // 把自己算进去
        query = {
            $or: [
                { author: { $in: following } },
                { collections: { $in: user.collFollowing } },
                { recommends: { $in: following } }
            ]
        }
        console.log(2);
    }

    articles.find(query,
        { limit: 10, sort: [['_id', 'desc']] },
        function(err, articles) {
            if (err) {
                console.log(3);
                console.log(err);
            } else {
                console.log(4);
                processArticleData(articles, true, null, function(arts) {
                    console.log(5);
                    res.render('read', {
                        title: "杂志",
                        articles: arts,
                        user: req.user
                    });
                });
            }
        }
    );
});

/*
  处理文章信息，包括查找作者，并提取副标题等
  needSubtitle 在副标题为空时，是否需要从内容提取副标题
  user 如果有传表示需要知道是否有订阅文章作者和文集
 */
function processArticleData(articles, needSubtitle, user, callback) {
    var count = 0;
    var counter = 0;

    var isAuthorComplete = false;
    var isCollComplete = false;

    if (!articles || articles.length == 0) {
        callback(articles);
    }

    function findCollCallback() {
        if (counter == articles.length) {
            isCollComplete = true;

            if (isAuthorComplete) {
                callback(articles);
                console.log('findCollCallback, callback called.')
            }
        }
    }

    function findAuthorCallback() {
        // 如果已经循环完毕了
        if (count == articles.length) {
            isAuthorComplete = true;

            if (isCollComplete) {
                callback(articles);
                console.log('findAuthorCallback, callback called.')
            }
        }
    }

    articles.forEach(function(article, index) {
        if (!article) {
            count++;
            counter++;
            findAuthorCallback();
            findCollCallback();

            console.log('article is null, forEach function returned.');
            return;
        }

        var authorId = article.author;
        var users = db.get('users');

        if (needSubtitle && !article.subtitle) {
            article.subtitle = extractSubtitle(article.content);
        }

        users.findById(authorId, function(err, author) {
            count++;
            if (err) {

            } else {
                author.isFollowing = user && include(user.userFollowing, author._id.toString());
                article.author = author;
            }

            findAuthorCallback();
        });

        if (article.collections && article.collections.length > 0) {
            collections.findById(article.collections[0], function(err, collection) {
                counter++;
                if (err) {

                } else {
                    article.collection = collection;
                    collection.isFollowing = user &&
                        user.collFollowing &&
                        include(user.collFollowing, collection._id.toString());
                }

                findCollCallback();
            });
        } else {
            counter++;
            findCollCallback();
        }
    });
}

router.get('/article/:articleId', function(req, res) {
    var articleId = req.param('articleId');

    console.log('articleId: ');
    console.log(articleId);

    articles.findById(articleId, function(err, article) {
        if (err) {

        } else {
            console.log('found article:');
            console.log(article);

            processArticleData([ article ], false, req.user, function(articleArr) {
                var newArticle = articleArr && articleArr[0];

                if (!newArticle) {
                    res.send('查找文章失败');
                    return;
                }

                newArticle.isRecommended = include(newArticle.recommends, req.user && req.user._id.toString());

                // newArticle.isFollowing =

                res.render('article', {
                    article: newArticle,
                    user: req.user
                });
            });
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

        console.log('remove article err:');
        console.log(err);

        articles.findById(articleId, function(err, article) {
            console.log('article after remove: ');
            console.log(article);
        })

        res.json({ status: 'success', data: null });
    });
});

router.get('/about', function(req, res) {
    res.render('about', {
        title: "关于"
    });
});

router.get('/drafts', function(req, res) {
    res.render('drafts', {
        title: "草稿"
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

    if (!uid) {
        res.send('用户id为空');
        return;
    }

    users.findById(uid, function(err, user) {
        if (err != null) {

        } else {
            user.isFollowing = req.user && include(req.user.userFollowing, uid);

            articles.find({ author: articles.id(uid) }, { limit: 4 }, function(err, docs) {
                if (err) {

                } else {
                    console.log('user articles: ');
                    console.log(docs);

                    processArticleData(docs, true, null, function(newDocs) {
                        collections.find({ creator: collections.id(uid) }, { limit: 4 }, function(err, colls) {
                            if (err) {
                                console.log(err);
                                res.send(err);
                            } else {
                                processColls(colls, req.user, function(newColls) {

                                    articles.find({ recommends: users.id(uid) }, { limit: 4 }, function(err, arts) {
                                        if (err) {
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            processArticleData(arts, false, req.user, function(newArts) {
                                                // todo 要判断主人态，主人态要加编辑功能
                                                res.render('home', {
                                                    title: "个人主页",
                                                    user: req.user,
                                                    targetUser: user,
                                                    articles: newDocs,
                                                    collections: newColls,
                                                    recommends: newArts
                                                });
                                            });
                                        }
                                    });

                                });
                            }
                        });
                    });
                }
            });
        }

    })
});

function include(arr, obj) {
    return obj && arr && arr.some(function(item) {
        return item.toString() == obj;
    });
}

router.get('/collections', function(req, res) {

    collections.find({}, function(err, colls) {
        if (err) {

        } else {

            var user = req.user;

            processColls(colls, user, function(newColls) {
                res.render('collections', {
                    title: '文集',
                    collections: newColls,
                    user: user
                });
            });
        }
    });
});

function processColls(colls, currUser, callback) {
    colls.forEach(function(collection, index) {
        collection.isFollowing = currUser &&
            currUser.collFollowing &&
            include(currUser.collFollowing, collection._id.toString());
    });

    callback(colls);
}

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
            coll.isFollowing = user && user.collFollowing && include(user.collFollowing, collId);

            // 根据文集的id来找文章，todo: 这样写可以吗
            articles.find({collections: collections.id(collId)}, function(err, arts) {
                if (err) {

                } else {
                    processArticleData(arts, true, null, function(newArticles) {
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
    }}, { upsert: true }, function(err, coll) {
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
        return;
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

router.get('/subscribe_coll', function(req, res) {

    var collId = req.query['collId'];
    var op = req.query['op'];

    if (!collId) {
        res.json({
            status: 'fail',
            message: '文集id为空，无法订阅'
        });

        return;
    }

    if (!req.user) {
        res.json({
            status: 'fail',
            code: 1,
            message: '请登录'
        });
        return;
    }

    console.log('subscribe collId: ');
    console.log(collId);

    var replacement = op == 1 ?
    {
        $addToSet: {
            collFollowing: users.id(collId)
        }
    }
        :
    {
        $pull: {
            collFollowing: users.id(collId)
        }
    };

    users.findAndModify({_id: req.user._id}, replacement, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
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
                message: '操作成功',
                data: {
                    isFollowing: op == 1
                }
            });
        }
    });
});

router.get('/auth/qq',
    passport.authenticate('qq', {scope: 'get_user_info'})
);

router.get('/auth/qq/callback',
    passport.authenticate('qq', { successRedirect: '/loginredirect?suc=1', failureRedirect: '/loginredirect?suc=0' })
);

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// 这个页面专门用来做登录后的跳转，通知给登录窗口的opener
router.get('/loginredirect', function(req, res) {
    // var isSuc = req.query['suc'] == 1;
    res.render('loginredirect', { });
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
    console.log('start to update.');

    if (!articleId) { // 没有articleId表示要新建一个
        articleId = articles.id();
    }
    articles.findAndModify({_id: articleId}, {$set: articleData}, {upsert: true}, function(err, article) {
        if (err) {

        } else {
            console.log('articleId: ' + articleId);
            res.redirect('/article/' + articleId);
        }
    });
});

router.get('/myarticles', function(req, res) {
    if (!req.user) {
        res.json({
            status: 'fail',
            code: 1,
            message: '请登录'
        });
        return;
    }

    var uid = req.user._id;
    console.log('get myarticles, uid: ' + uid);

    var collId = req.query.collId;

    if (!collId) {
        res.json({
            status: 'fail',
            message: '缺少文集id'
        });
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
            res.json({
                status: 'success',
                data: {
                    html: html
                }
            })
        })
    });
});

router.get('/contribute', function(req, res) {
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

router.get('/decontribute', function(req, res) {
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

router.get('/recommend_article', function(req, res) {
    var articleId = req.query['articleId'];
    var op = req.query['op'];

    if (!req.user) {
        res.json({
            status: 'fail',
            code: 1,
            message: '请登录'
        });
        return;
    }

    var uid = req.user._id;

    if (!articleId || !uid) {
        res.json({
            status: 'fail',
            message: '文章id或用户id为空，无法推荐'
        });

        return;
    }


    var replacement = op == 1 ?
    {
        $addToSet: {
            recommends: users.id(uid)
        }
    }
        :
    {
        $pull: {
            recommends: users.id(uid)
        }
    };

    articles.update({_id: articleId}, replacement, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });

            return;
        }

        if (count > 0) {
            res.json({
                status: 'success',
                message: '推荐成功',
                data: {
                    isRecommended: op == 1
                }
            });
        } else {
            res.json({
                status: 'fail',
                message: '推荐失败'
            });
        }
    });

});

function extractSubtitle(content) {
    return content && content.replace(/(<([^>]+)>)/ig, '').substr(0, 60) + '...';
}

router.get('/follow_user', function(req, res) {
    var uid = req.query['uid'];
    var op = req.query['op'];

    if (!uid) {
        res.json({
            status: 'fail',
            message: '用户id为空，无法收听'
        });

        return;
    }

    if (!req.user) {
        res.json({
            status: 'fail',
            code: 1,
            message: '请登录'
        });
        return;
    }

    var replacement = op == 1 ?
    {
        $addToSet: {
            userFollowing: users.id(uid)
        }
    }
        :
    {
        $pull: {
            userFollowing: users.id(uid)
        }
    };

    users.update({_id: req.user._id}, replacement, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });

            return;
        }

        if (count > 0) {
            res.json({
                status: 'success',
                message: '修改订阅状态成功',
                data: {
                    isFollowing: op == 1
                }
            });
        } else {
            res.json({
                status: 'fail',
                message: '修改订阅状态失败'
            });
        }
    });


});

router.get('/writers', function(req, res) {
    users.find({}, { limit: 10 }, function(err, writers) {
        if (err) {
            res.send(err);
            return;
        }

        writers.forEach(function(writer, index) {
            writer.isFollowing = req.user && include(req.user.userFollowing, writer._id.toString());
        });

        res.render('writers', {
            users: writers,
            user: req.user
        });
    });
});

router.put('/users/:uid', function(req, res) {
    var uid = req.params['uid'];

    var nickname = req.body.nickname;
    var intro = req.body.intro;
    // todo 对nickname做一些判空的处理

    users.update({ _id: uid }, { $set: { nickname: nickname, intro: intro } }, function(err, count) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });
        } else if (count > 0) {
            res.json({
                status: 'success',
                message: '修改成功'
            });
        } else {
            res.json({
                status: 'fail',
                message: '未修改成功'
            });
        }
    });

});

router.get('/myreads', function(req, res) {
    var user = req.user;
    var pageNum = req.query['page'];
    var query;

    if (!user) {
        /*res.json({
            status: 'fail',
            message: '请登录'
        });*/

        query = {};

    } else {
        query = {
            $or: [
                { author: { $in: user.userFollowing } },
                { collections: { $in: user.collFollowing } },
                { recommends: { $in: user.userFollowing } }
            ]
        };
    }

    articles.find(query,
        { limit: 10, skip: 10*(pageNum - 1), sort: [['_id', 'desc']] },
        function(err, articles) {
            if (err) {
                res.json({
                    status: 'error',
                    message: err.toString()
                });
            } else {
                processArticleData(articles, true, null, function(arts) {
                    /*res.render('read', {
                        title: "杂志",
                        articles: arts,
                        user: req.user
                    });*/

                    res.json({
                        status: 'success',
                        message: '成功',
                        data: arts
                    });
                });
            }
        }
    );
});

module.exports = router;