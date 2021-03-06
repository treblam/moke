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

router.get('/read', function(req, res, next) {
    var db = req.db;
    var articles = db.get('articles');
    var user = req.user;
    var query;

    if (user == null) {
        query = {draft: { $ne: true }};
    } else {
        var following = user.userFollowing;
        following.push(user._id); // 把自己算进去
        query = {
            draft: { $ne: true },
            $or: [
                { author: { $in: following } },
                { collections: { $in: user.collFollowing } },
                { recommends: { $in: following } }
            ]
        }
    }

    articles.find(query,
        { limit: 10, sort: [['publishTime', 'desc'], ['_id', 'desc']] },
        function(err, articles) {
            if (err) {
                console.log(err);
                return next(err);
            }

            processArticleData(articles, true, null, function(arts) {
                res.render('read', {
                    title: "杂志",
                    articles: arts,
                    user: req.user,
                    id: 'read'
                });
            });
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
            }
        }
    }

    function findAuthorCallback() {
        // 如果已经循环完毕了
        if (count == articles.length) {
            isAuthorComplete = true;

            if (isCollComplete) {
                callback(articles);
            }
        }
    }

    articles.forEach(function(article, index) {
        if (!article) {
            count++;
            counter++;
            findAuthorCallback();
            findCollCallback();
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

router.get('/article/:articleId', function(req, res, next) {
    var articleId = req.param('articleId');

    console.log('articleId: ');
    console.log(articleId);

    articles.find({
        _id: articleId,
        draft: { $ne: true }
    }, function(err, arts) {
        if (err) {
            console.log(err);
            return next(err);
        }

        console.log('found article.');
        processArticleData(arts, false, req.user, function(articleArr) {
            var newArticle = articleArr && articleArr[0];

            if (!newArticle) {
                res.send('查找文章失败');
                return;
            }

            newArticle.isRecommended = include(newArticle.recommends, req.user && req.user._id.toString());

            res.render('article', {
                article: newArticle,
                user: req.user
            });
        });
    });
});

router.delete('/article', function(req, res) {
    var articleId = req.body.articleId;

    articles.remove({_id: articles.id(articleId)}, function(err) {
        if (err) {
            console.log('remove error: ');
            console.log(err);
            res.json({
                status: 'error',
                message: err.toString()
            });
        } else {
            res.json({
                status: 'success',
                data: null
            });
        }
        console.log('remove articleId: ');
        console.log(articleId);
    });
});

router.get('/about', function(req, res) {
    res.render('about', {
        title: "关于"
    });
});

/*router.get('/drafts', filter.authorize, function(req, res, next) {
    var user = req.user;
    if (!user) {
        return next(new Error('查找草稿出错'));
    }

    articles.find({
        author: user._id,
        draft: true
    }, function(err, articles) {
        if (err) {
            return next(err);
        }

        //if (articles && articles.length > 0) {
            res.render('drafts', {
                title: "草稿",
                user: req.user,
                articles: articles,
                id: 'drafts'
            });
        *//*} else {
            res.redirect('/write');
        }*//*
    });
});*/

router.get('/drafts', function(req, res) {
    var user = req.user;
    var isDraft = req.query['draft'] === 'true';
    var pageNum = req.query['page'];

    if (!user) {
        res.json({
            status: 'fail',
            code: '1',
            message: '请登录'
        });
        return;
    }

    articles.find({
        author: user._id,
        draft: isDraft ? true : { $ne: true }
    },
    {
        sort: [[isDraft ? '_id' : 'publishTime', 'desc'], ['_id', 'desc']],
        limit: 10,
        skip: 10*(pageNum - 1),
        fields: {
            title: true,
            subtitle: true,
            publishTime: true
        }
    },
    function(err, articles) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });
            return;
        }

        //if (articles && articles.length > 0) {
        res.json({
            status: 'success',
            data: articles,
            message: '成功'
        });
        /*} else {
         res.redirect('/write');
         }*/
    });
});

router.get('/drafts/:draftId', function(req, res) {
    var draftId = req.param('draftId');
    if (!draftId) {
        res.json({
            status: 'fail',
            message: 'id为空'
        });
        return;
    }

    articles.findById(draftId, function(err, draft) {
        if (err) {
            return res.json({
                status: 'error',
                message: err.toString()
            });
        }
        res.json({
            status: 'success',
            message: '成功',
            data: draft
        });
    });
});

router.get('/write/:articleId?', filter.authorize, function(req, res) {
    var articleId = req.param('articleId');

    if (articleId) {
        articles.findById(articleId, function(err, article) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.render('write', {
                title: '写作',
                article: article,
                user: req.user,
                id: 'write'
            });
        });
    } else {
        console.log('no article id, user: ');
        console.log(req.user);
        res.render('write', {
            title: "写作",
            user: req.user,
            id: 'write'
        });
    }
});

router.get('/signin', function(req, res) {
    res.render('signin', {
        title: '登录'
    });
});

/*router.post('/signin', function(req, res) {
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
});*/

router.get('/home/:uid', function(req, res, next) {
    var uid = req.param('uid');
    console.log('uid: ');
    console.log(uid);

    users.findById(uid, function(err, user) {
        if (err) {
            console.log('User home find user error: ');
            console.log(err);
            return next(err);
        } else {
            if (!user) {
                res.send(404, '未找到用户');
                return;
            }

            user.isFollowing = req.user && include(req.user.userFollowing, uid);

            articles.find({ author: articles.id(uid), draft: { $ne: true } }, { limit: 4, sort: [['publishTime', 'desc'], ['_id', 'desc']] }, function(err, docs) {
                if (err) {
                    console.log('find articles by author error: ');
                    console.log(err);
                } else {
                    console.log('find articles by author success.');
                    processArticleData(docs, true, null, function(newDocs) {
                        collections.find({ creator: collections.id(uid) }, { limit: 4 }, function(err, colls) {
                            if (err) {
                                console.log(err);
                                return next(err);
                            }
                            processColls(colls, req.user, function(newColls) {
                                // todo recommends需要根据时间来排序
                                articles.find({ recommends: users.id(uid) }, { limit: 4 }, function(err, arts) {
                                    if (err) {
                                        console.log(err);
                                        return next(err);
                                    }
                                    processArticleData(arts, false, req.user, function(newArts) {
                                        res.render('home', {
                                            title: "个人主页",
                                            user: req.user,
                                            targetUser: user,
                                            articles: newDocs,
                                            collections: newColls,
                                            recommends: newArts
                                        });
                                    });
                                });
                            });
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

router.get('/collections', function(req, res, next) {
    collections.find({}, function(err, colls) {
        if (err) {
            return next(err);
        }

        var user = req.user;
        processColls(colls, user, function(newColls) {
            res.render('collections', {
                title: '文集',
                collections: newColls,
                user: user,
                id: 'collections'
            });
        });
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

router.get('/collection/:collectionId', function(req, res, next) {
    var collId = req.param('collectionId');

    collections.findById(collId, function(err, coll) {
        if (err) {
            return next(err);
        }
        if (!coll) {
            console.log('未找到指定的文集');
            res.send(404, '未找到指定的文集');
            return;
        }
        var user = req.user;
        coll.isFollowing = user && user.collFollowing && include(user.collFollowing, collId);

        // 根据文集的id来找文章
        articles.find({collections: collections.id(collId)}, function(err, arts) {
            if (err) {
                return next(err);
            }

            processArticleData(arts, true, null, function(newArticles) {
                coll.articles = newArticles;
                res.render('collection', {
                    title: '文集',
                    user: req.user,
                    collection: coll
                });
            });
        });
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

router.get('/auth/qq/callback', function(req, res, next) {
        passport.authenticate('qq', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.render('loginredirect', {suc: 0}); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                var redirectTo = req.session.redirectTo;
                delete req.session.redirectTo;
                return res.render('loginredirect', {suc: 1, redirectTo: redirectTo});
            });
        })(req, res, next);
    }
//{ successRedirect: '/loginredirect?suc=1', failureRedirect: '/loginredirect?suc=0' }
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

/**
 * 发表文章
 */
router.post('/articles', editArticle);

router.put('/articles/:articleId', editArticle);

function editArticle(req, res) {
    /*var title = req.body.title;
     var subtitle = req.body.subtitle;
     var content = req.body.content;
     var articleId = req.body.articleId;
     var draft = req.body.draft === 'true';*/

    var articleId = req.param('articleId');

    if (!req.user) {
        res.json({
            status: 'fail',
            code: 1,
            message: '请登录'
        });
        return;
    }

    var articleData = req.body;
    articleData.author = req.user._id;
    var isFirstPublish = articleData.draft && articleData.isPublish;
    articleData.draft = articleData.draft && !articleData.isPublish;
    if (isFirstPublish) { // 首次发布把发布时间写进去
        articleData.publishTime = Date.now();
    }

    /*var articleData = {
     title: title,
     subtitle: subtitle,
     content: content,
     author: req.user._id,
     draft: draft
     };*/

    //console.log('post to write, articleId: ' + articleId);
    console.log('start to update.');

    if (!articleId) { // 没有articleId表示要新建一个
        articleId = articles.id();
    }

    articles.findAndModify({_id: articleId}, {$set: articleData}, {upsert: true}, function(err, article) {
        if (err) {
            res.json({
                status: 'error',
                message: err.toString()
            });
            return;
        }

        res.json({
            status: 'success',
            message: '成功',
            data: article
        });
        console.log('articleId: ' + articleId);
//        res.redirect('/article/' + articleId);
    });
}

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

        return;
    }

    articles.find({author: uid, draft: { $ne: true }}, function(err, articles) {
        articles.forEach(function(article, index) {
            article.isContributed = article.collections && include(article.collections, collId);
        });

        res.app.render('myarticles', {
            articles: articles,
            collId: collId
        }, function(err, html) {
            console.log('get my articles html.');
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
    var SUBTITLE_LEN = 60;
    var subtitle;
    if (content) {
        var textContent = content && content.replace(/(<([^>]+)>)/ig, '');
        if (textContent.length > SUBTITLE_LEN) {
            subtitle = textContent.substr(0, 60) + '...';
        } else {
            subtitle = textContent;
        }
    }

    return subtitle;
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

router.get('/writers', function(req, res, next) {
    users.find({}, { limit: 10 }, function(err, writers) {
        if (err) {
            return next(err);
        }

        writers.forEach(function(writer, index) {
            writer.isFollowing = req.user && include(req.user.userFollowing, writer._id.toString());
        });

        res.render('writers', {
            users: writers,
            user: req.user,
            id: 'writers'
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

        query = {
            draft: { $ne: true }
        };

    } else {
        query = {
            draft: { $ne: true },
            $or: [
                { author: { $in: user.userFollowing } },
                { collections: { $in: user.collFollowing } },
                { recommends: { $in: user.userFollowing } }
            ]
        };
    }

    articles.find(query,
        { limit: 10, skip: 10*(pageNum - 1), sort: [['publishTime', 'desc'], ['_id', 'desc']] },
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