var SITE = "https://fbbtube.com";
var LGBT = /\b(lezdom\w*|lez|lesbi\w*|lesbo\w*|girl on girl|sapphic|trans|transgender|transsexual|tranny|shemale\w*|tgirl\w*|sissy\w*|gay|futa\w*|ff)\b/i;

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search?q=" + encodeURIComponent(query) + (page > 1 ? "&page=" + page : ""));
  var chunks = html.split('<a class="group flex');
  var items = [];
  var seen = {};
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i];
    var href = c.match(/href="(\/videos\/[a-z0-9-]+)"/);
    var title = c.match(/<h3[^>]*>([^<]+)<\/h3>/);
    if (!href || !title || seen[href[1]]) continue;
    seen[href[1]] = 1;
    var t = util.unescape(title[1]);
    if (LGBT.test(t)) continue;
    var thumb = c.match(/<img src="([^"]+)"/);
    var dur = c.match(/text-white">([0-9]+:[0-9:]+)</);
    var author = c.match(/text-brand-400\/80">([^<]*)</);
    items.push({ url: SITE + href[1], title: t, author: author ? util.unescape(author[1]) : "",
      duration: dur ? util.duration(dur[1]) : -1,
      thumb: thumb ? util.unescape(thumb[1]) : "" });
  }
  return { items: items, next: chunks.length > 24 ? String(page + 1) : null };
}

function resolve(url) {
  var html = http.get(url);
  var m = html.match(/https:\/\/fbbtube\.com\/media\/hls\/[A-Za-z0-9]+\/master\.m3u8/);
  if (!m) throw new Error("video unavailable");
  var t = html.match(/<meta property="og:title" content="([^"]*)"/);
  var title = t ? util.unescape(t[1]).replace(/\s*\|\s*FBB Tube$/, "") : "";
  return { url: m[0], hls: true, title: title, referer: SITE + "/" };
}
