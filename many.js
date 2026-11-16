var SITE = "https://many.xxx";

function clean(s) {
  return util.unescape(s || "").replace(/\s+/g, " ").trim();
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var q = encodeURIComponent(query.trim().replace(/\s+/g, "-"));
  var html = http.get(SITE + "/search/" + q + "/" + (page > 1 ? page + "/" : ""));
  var cards = html.split('<a class="thumb_img"');
  var items = [], seen = {};
  for (var i = 1; i < cards.length; i++) {
    var c = cards[i];
    var href = /href="(https:\/\/many\.xxx\/videos\/\d+\/[^"]+)"/.exec(c);
    if (!href || seen[href[1]]) continue;
    seen[href[1]] = true;
    var title = /title="([^"]+)"/.exec(c);
    var thumb = /src="(https:\/\/img\.many\.xxx\/[^"]+\.jpg)"/.exec(c);
    var dur = /class="duration">[^0-9<]*([0-9:]+)/.exec(c);
    items.push({
      url: href[1],
      title: title ? clean(title[1]) : "",
      author: "",
      thumb: thumb ? thumb[1] : null,
      duration: dur ? util.duration(dur[1]) : -1
    });
  }
  var more = html.indexOf("/search/" + q + "/" + (page + 1) + "/") >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var id = /\/videos\/(\d+)\//.exec(url);
  if (!id) throw new Error("no id");
  var embed = SITE + "/embed/" + id[1];
  var html = http.get(embed);
  var src = /(https:\/\/many\.xxx\/get_file\/[^"'\s]+\.mp4\/[^"'\s]*)/.exec(html);
  if (!src) throw new Error("no stream");
  var title = /<title>([^<]*)<\/title>/.exec(html);
  return { url: src[1].replace(/&amp;/g, "&"), hls: false, referer: embed, title: title ? clean(title[1]) : "" };
}
