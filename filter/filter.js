/**
 * Created by jamie on 14-5-19.
 */

exports.authorize = function(req, res, next) {
    if (!req.user) {
        res.redirect('/signin');
    } else {
        next();
    }
}