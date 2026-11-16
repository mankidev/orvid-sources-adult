var SITE = "https://sharedhotwife.com";

function clean(s) {
  return util.unescape(s || "").replace(/\s+/g, " ").trim();
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search?q=" + encodeURIComponent(query.trim()) + (page > 1 ? "&page=" + page : ""));
  var cards = html.split('<div class="group relative">');
  var items = [], seen = {};
  for (var i = 1; i < cards.length; i++) {
    var c = cards[i];
    var href = /href="(\/watch\/[^"]+)"/.exec(c);
    if (!href || seen[href[1]]) continue;
    seen[href[1]] = true;
    var title = /alt="([^"]+)"/.exec(c);
    var thumb = /src="(https:\/\/img\.tpbox\.net\/[^"]+)"/.exec(c);
    var dur = />(\d+:\d\d(?::\d\d)?)</.exec(c);
    items.push({
      url: SITE + href[1],
      title: title ? clean(title[1]) : "",
      author: "",
      thumb: thumb ? thumb[1] : null,
      duration: dur ? util.duration(dur[1]) : -1
    });
  }
  var more = html.indexOf("page=" + (page + 1)) >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var html = http.get(url);
  var src = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/.exec(html) || /(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/.exec(html);
  if (!src) throw new Error("no stream");
  var title = /property="og:title"\s+content="([^"]*)"/.exec(html) || /<title>([^<]*)<\/title>/.exec(html);
  return { url: src[1].replace(/&amp;/g, "&"), hls: src[1].indexOf(".m3u8") >= 0, referer: SITE + "/", title: title ? clean(title[1]) : "" };
}
