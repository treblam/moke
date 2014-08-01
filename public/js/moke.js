/**
 * Created by jamie on 14-5-21.
 */

$('#menu-btn').click(function(e) {
    e.preventDefault();
    var siteMenu = $('#site-menu');
    if (siteMenu.is(':visible')) {
        siteMenu.slideUp();
    } else {
        siteMenu.slideDown();
    }

//    $('#site-menu').slideDown();
});

$(document).mouseup(function(e) {
    var siteMenu = $('#site-menu');

    if (!siteMenu.is(e.target) && siteMenu.has(e.target).length === 0) {
        siteMenu.slideUp();
    }
});

var LoginUtil = {
    isLogin: function() {

    },
    login: function() {
        $('#login-modal').modal();
    },
    init: function() {
        $(document).on('click', '#qq-login', function(e) {
            window.open('/auth/qq');
        });

        $(window).on('message', function(e) {
            if (e.isSuc) {
                if (/\/signin$/.test(window.location.href)) {
                    window.location.href = '/read';
                } else {
                    window.location.reload();
                }
            } else {
                // do nothing.
            }
        });
    }
};

LoginUtil.init();

var AlertUtil = {
    alert: function(type, text, autoDismiss) {
        autoDismiss = typeof autoDismiss !== 'undefined' ? autoDismiss : true;
        var className = 'alert-' + type;
        var alertHtml = '<div class="alert ' + className + (autoDismiss ? '' : ' alert-dismissable') + ' alert-position">' +
            text +
            (autoDismiss ? '' : '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>') +
            '</div>';

        var alertEle = $(alertHtml).appendTo($('body'));

        if (autoDismiss) {
            setTimeout(function() {
                alertEle.fadeOut(function() {
                    alertEle.remove();
                });
            }, 2000);
        }
    }
};

$(document).on('click', '.subscribe-coll', function(e) {
    var button = $(this);
    var isFollowing = button.is('.btn-success');
    var collId = button.data('collid');

    $.ajax({
        url: '/subscribe_coll',
        data: {collId: collId, op: isFollowing ? '0' : '1'}
    }).done(function(data) {
        if (data) {
            if (data.status == 'success') {
                if (data.data.isFollowing) {
                    button.removeClass('btn-default').addClass('btn-success').text('已订阅');
                } else {
                    button.removeClass('btn-success').addClass('btn-default').text('订阅');
                }
            } else if (data.status == 'fail') {
                switch (data.code) {
                    case 1:
                        LoginUtil.login();
                        break;
                }
            } else {
                alert(data.message);
            }
        } else {
            alert('操作失败');
        }
    }).fail(function(jqXHR, statusText) {
        alert('操作失败');
    });
}).on('click', '#create-collection', function(e) { // 创建文集
    window.location.href = '/edit_collection';
}).on('click', '.follow-user', function(e) {
    e.preventDefault(); // 在作者列表页需要这个
    e.stopPropagation();
    var button = $(this);
    var isFollowing = button.is('.btn-success');
    var uid = button.data('uid');
    $.ajax({
        url: '/follow_user',
        data: {
            uid: uid,
            op: isFollowing ? 0 : 1
        }
    }).success(function(data) {
        if (data.status == 'success') {
            if (data.data.isFollowing) {
                button.removeClass('btn-default').addClass('btn-success');
                button.text('已关注')
            } else {
                button.removeClass('btn-success').addClass('btn-default');
                button.text('关注')
            }
        } else if (data.status == 'fail') {
            switch (data.code) {
                case 1:
                    LoginUtil.login();
                    break;
            }
        } else {
            alert(data.message);
        }
    });
}).on('click', '#recommend-article', function(e) {
    // 根据class来判断要做何操作
    var button = $(this);
    var op = button.is('.btn-default') ? 1 : 0;

    $.ajax({
        url: '/recommend_article',
        data: {
            op: op,
            articleId: articleId
        }
    }).done(function(data) {
        if (data.status == 'success') {
            if (data.data.isRecommended) {
                button.removeClass('btn-default').addClass('btn-success');
                button.text('已推荐')
            } else {
                button.removeClass('btn-success').addClass('btn-default');
                button.text('推荐');
            }
        } else if (data.status == 'fail') {
            switch (data.code) {
                case 1:
                    LoginUtil.login();
                    break;
            }
        } else {
            alert(data.message);
        }
    });
}).on('click', '#new-article', function(e) {
    window.location.href = '/write';
});