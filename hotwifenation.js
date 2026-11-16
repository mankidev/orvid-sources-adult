var SITE = "https://hotwifenation.com";

function clean(s) {
  return util.unescape(s || "").replace(/\s+/g, " ").trim();
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search/?q=" + encodeURIComponent(query.trim()) + (page > 1 ? "&page=" + page : ""));
  var cards = html.split('class="vcard__thumb"');
  var items = [], seen = {};
  for (var i = 1; i < cards.length; i++) {
    var c = cards[i];
    var href = /href="(\/watch\/[^"]+)"/.exec(c);
    if (!href || seen[href[1]]) continue;
    seen[href[1]] = true;
    var title = /alt="([^"]+)"/.exec(c);
    var thumb = /<img src="(\/media\/thumbs\/[^"]+)"/.exec(c);
    var dur = /class="vcard__dur">([0-9:]+)</.exec(c);
    items.push({
      url: SITE + href[1],
      title: title ? clean(title[1]) : "",
      author: "",
      thumb: thumb ? SITE + util.unescape(thumb[1]) : null,
      duration: dur ? util.duration(dur[1]) : -1
    });
  }
  var more = html.indexOf("page=" + (page + 1)) >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var html = http.get(url);
  var src = /(https?:\/\/hotwifenation\.com\/video\/[^"'\s]+\.m3u8)/.exec(html);
  if (!src) {
    var slug = /\/watch\/([^\/?#]+)/.exec(url);
    if (!slug) throw new Error("no stream");
    src = [null, SITE + "/video/" + slug[1] + ".m3u8"];
  }
  var title = /property="og:title"\s+content="([^"]*)"/.exec(html) || /<title>([^<]*)<\/title>/.exec(html);
  return { url: src[1], hls: true, referer: SITE + "/", title: title ? clean(title[1]) : "" };
}
