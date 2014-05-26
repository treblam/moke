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