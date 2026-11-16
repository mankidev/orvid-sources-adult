var SITE = "https://www.grannypussy.com";

function clean(s) {
  return util.unescape(s || "").replace(/\s+/g, " ").trim();
}

function search(query, next) {
  var path = next || "/search/" + encodeURIComponent(query.trim().replace(/\s+/g, "-")) + "/";
  var num = /\/(\d+)\/$/.exec(path);
  var page = next && num ? parseInt(num[1], 10) : 1;
  var html = http.get(SITE + path);
  var cards = html.split('data-type="vid"');
  var items = [], seen = {};
  for (var i = 1; i < cards.length; i++) {
    var c = cards[i];
    var href = /href="(\/videos\/[^"]+\.html)"/.exec(c);
    if (!href || seen[href[1]]) continue;
    seen[href[1]] = true;
    var title = /title="([^"]+)"/.exec(c);
    var thumb = /data-src="(https?:\/\/[^"]+\.(?:jpg|webp))"/.exec(c);
    var dur = /<span class="[^"]*(?:timer|time)[^"]*">\s*([0-9:]+)/.exec(c);
    items.push({
      url: SITE + href[1],
      title: title ? clean(title[1]) : "",
      author: "",
      thumb: thumb ? thumb[1] : null,
      duration: dur ? util.duration(dur[1]) : -1
    });
  }
  var more = new RegExp('href="((?:' + SITE.replace(/\./g, "\\.") + ')?(/(?:search|category|tags?)/[^"]*/)' + (page + 1) + '/)"').exec(html);
  return { items: items, next: items.length && more ? (more[2] + (page + 1) + "/").replace(/ /g, "%20") : null };
}

function resolve(url) {
  var html = http.get(url);
  var b = /atob\('([A-Za-z0-9+\/=]+)'\)/.exec(html);
  if (!b) throw new Error("no stream");
  var src = util.base64(b[1]);
  var title = /property="og:title"\s+content="([^"]*)"/.exec(html) || /<title>([^<]*)<\/title>/.exec(html);
  return { url: src, hls: false, referer: SITE + "/", title: title ? clean(title[1]) : "" };
}
