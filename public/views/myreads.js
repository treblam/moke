function template(locals) {
var jade_debug = [{ lineno: 1, filename: "./myreads.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (articles, undefined) {
jade_debug.unshift({ lineno: 0, filename: "./myreads.jade" });
jade_debug.unshift({ lineno: 1, filename: "./myreads.jade" });
// iterate articles
;(function(){
  var $$obj = articles;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var article = $$obj[$index];

jade_debug.unshift({ lineno: 1, filename: "./myreads.jade" });
jade_debug.unshift({ lineno: 2, filename: "./myreads.jade" });
buf.push("<article class=\"article\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 3, filename: "./myreads.jade" });
buf.push("<header>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 5, filename: "./myreads.jade" });
buf.push("<!-- <div class=\"collection\"><a href=\"#\">月过女墙</a></div>-->");
jade_debug.shift();
jade_debug.unshift({ lineno: 5, filename: "./myreads.jade" });
buf.push("<hgroup>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 6, filename: "./myreads.jade" });
buf.push("<h3 class=\"title\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 7, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/article/' + (article._id) + '', true, false)) + ">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 7, filename: jade_debug[0].filename });
buf.push("" + (jade.escape((jade_interp = article.title) == null ? '' : jade_interp)) + "");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</h3>");
jade_debug.shift();
jade_debug.unshift({ lineno: 8, filename: "./myreads.jade" });
buf.push("<h4 class=\"subtitle\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 9, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/article/' + (article._id) + '', true, false)) + ">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 9, filename: jade_debug[0].filename });
buf.push("" + (jade.escape((jade_interp = article.subtitle) == null ? '' : jade_interp)) + "");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</h4>");
jade_debug.shift();
jade_debug.shift();
buf.push("</hgroup>");
jade_debug.shift();
jade_debug.unshift({ lineno: 10, filename: "./myreads.jade" });
buf.push("<section class=\"article-info\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 11, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/home/' + (article.author._id) + '', true, false)) + " class=\"avatar\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 12, filename: "./myreads.jade" });
buf.push("<img" + (jade.attr("src", '' + (article.author.avatar_s) + '', true, false)) + " alt=\"作者\"/>");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.unshift({ lineno: 13, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/home/' + (article.author._id) + '', true, false)) + ">" + (jade.escape(null == (jade_interp = article.author.nickname) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.unshift({ lineno: 14, filename: "./myreads.jade" });
if ( article.collection)
{
jade_debug.unshift({ lineno: 15, filename: "./myreads.jade" });
jade_debug.unshift({ lineno: 15, filename: "./myreads.jade" });
buf.push("发表在");
jade_debug.shift();
jade_debug.unshift({ lineno: 16, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/collection/' + (article.collection._id) + '', true, false)) + ">" + (jade.escape(null == (jade_interp = article.collection.name) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
}
jade_debug.shift();
jade_debug.shift();
buf.push("</section>");
jade_debug.shift();
jade_debug.shift();
buf.push("</header>");
jade_debug.shift();
jade_debug.shift();
buf.push("</article>");
jade_debug.shift();
jade_debug.shift();
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var article = $$obj[$index];

jade_debug.unshift({ lineno: 1, filename: "./myreads.jade" });
jade_debug.unshift({ lineno: 2, filename: "./myreads.jade" });
buf.push("<article class=\"article\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 3, filename: "./myreads.jade" });
buf.push("<header>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 5, filename: "./myreads.jade" });
buf.push("<!-- <div class=\"collection\"><a href=\"#\">月过女墙</a></div>-->");
jade_debug.shift();
jade_debug.unshift({ lineno: 5, filename: "./myreads.jade" });
buf.push("<hgroup>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 6, filename: "./myreads.jade" });
buf.push("<h3 class=\"title\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 7, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/article/' + (article._id) + '', true, false)) + ">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 7, filename: jade_debug[0].filename });
buf.push("" + (jade.escape((jade_interp = article.title) == null ? '' : jade_interp)) + "");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</h3>");
jade_debug.shift();
jade_debug.unshift({ lineno: 8, filename: "./myreads.jade" });
buf.push("<h4 class=\"subtitle\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 9, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/article/' + (article._id) + '', true, false)) + ">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 9, filename: jade_debug[0].filename });
buf.push("" + (jade.escape((jade_interp = article.subtitle) == null ? '' : jade_interp)) + "");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</h4>");
jade_debug.shift();
jade_debug.shift();
buf.push("</hgroup>");
jade_debug.shift();
jade_debug.unshift({ lineno: 10, filename: "./myreads.jade" });
buf.push("<section class=\"article-info\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 11, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/home/' + (article.author._id) + '', true, false)) + " class=\"avatar\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 12, filename: "./myreads.jade" });
buf.push("<img" + (jade.attr("src", '' + (article.author.avatar_s) + '', true, false)) + " alt=\"作者\"/>");
jade_debug.shift();
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.unshift({ lineno: 13, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/home/' + (article.author._id) + '', true, false)) + ">" + (jade.escape(null == (jade_interp = article.author.nickname) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.unshift({ lineno: 14, filename: "./myreads.jade" });
if ( article.collection)
{
jade_debug.unshift({ lineno: 15, filename: "./myreads.jade" });
jade_debug.unshift({ lineno: 15, filename: "./myreads.jade" });
buf.push("发表在");
jade_debug.shift();
jade_debug.unshift({ lineno: 16, filename: "./myreads.jade" });
buf.push("<a" + (jade.attr("href", '/collection/' + (article.collection._id) + '', true, false)) + ">" + (jade.escape(null == (jade_interp = article.collection.name) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
}
jade_debug.shift();
jade_debug.shift();
buf.push("</section>");
jade_debug.shift();
jade_debug.shift();
buf.push("</header>");
jade_debug.shift();
jade_debug.shift();
buf.push("</article>");
jade_debug.shift();
jade_debug.shift();
    }

  }
}).call(this);

jade_debug.shift();
jade_debug.shift();}("articles" in locals_for_with?locals_for_with.articles:typeof articles!=="undefined"?articles:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "each article in articles\n    article.article\n        header\n            // <div class=\"collection\"><a href=\"#\">月过女墙</a></div>\n            hgroup\n                h3.title\n                    a(href='/article/#{article._id}') #{article.title}\n                h4.subtitle\n                    a(href='/article/#{article._id}') #{article.subtitle}\n            section.article-info\n                a.avatar(href='/home/#{article.author._id}')\n                    img(src='#{article.author.avatar_s}', alt='作者')\n                a(href='/home/#{article.author._id}')= article.author.nickname\n                if article.collection\n                    | 发表在\n                    a(href='/collection/#{article.collection._id}')= article.collection.name");
}
}