function template(locals) {
var jade_debug = [{ lineno: 1, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (articles, undefined) {
jade_debug.unshift({ lineno: 0, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
jade_debug.unshift({ lineno: 1, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
// iterate articles
;(function(){
  var $$obj = articles;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var article = $$obj[$index];

jade_debug.unshift({ lineno: 1, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
jade_debug.unshift({ lineno: 2, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
buf.push("<li>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 3, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
buf.push("<a href=\"#\"" + (jade.attr("data-id", article._id, true, false)) + ">" + (jade.escape(null == (jade_interp = article.title) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</li>");
jade_debug.shift();
jade_debug.shift();
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var article = $$obj[$index];

jade_debug.unshift({ lineno: 1, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
jade_debug.unshift({ lineno: 2, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
buf.push("<li>");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 3, filename: "/Users/jamie/Projects/moke/views/cs_share/drafts.jade" });
buf.push("<a href=\"#\"" + (jade.attr("data-id", article._id, true, false)) + ">" + (jade.escape(null == (jade_interp = article.title) ? "" : jade_interp)));
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.shift();
buf.push("</a>");
jade_debug.shift();
jade_debug.shift();
buf.push("</li>");
jade_debug.shift();
jade_debug.shift();
    }

  }
}).call(this);

jade_debug.shift();
jade_debug.shift();}("articles" in locals_for_with?locals_for_with.articles:typeof articles!=="undefined"?articles:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "each article in articles\n    li\n        a(href='#' data-id=article._id)= article.title");
}
}