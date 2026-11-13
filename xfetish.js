var SITE = "https://x-fetish.tube";
var LGBT = /\b(lezdom\w*|lez|lezzy|lesbi\w*|lesbo\w*|girl on girl|girls on girls|sapphic|trans|transgender|transsexual|tranny|shemale\w*|tgirl\w*|sissy\w*|gay|gays|futa\w*|femboy\w*|crossdress\w*|twink\w*)\b/i;

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var slug = encodeURIComponent(query.trim().toLowerCase().replace(/\s+/g, "-"));
  var html = http.get(SITE + "/search/" + slug + "/" + (page > 1 ? page + "/" : ""));
  var chunks = html.split('class="item thumb thumb--videos"');
  var items = [];
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i];
    var href = c.match(/href="(https:\/\/x-fetish\.tube\/video\/\d+\/[^"]+)" title="([^"]*)"/);
    if (!href) continue;
    var title = util.unescape(href[2]).trim();
    if (!title || LGBT.test(title)) continue;
    var thumb = c.match(/data-src="(https:\/\/x-fetish\.tube\/contents\/[^"]+)"/);
    var dur = c.match(/icon-duration"><\/i>\s*([0-9:]+)/);
    var views = c.match(/icon-view"><\/i>\s*([0-9 ]+) views/);
    items.push({ url: href[1], title: title,
      duration: dur ? util.duration(dur[1]) : -1,
      views: views ? parseInt(views[1].replace(/\D/g, ""), 10) : -1,
      thumb: thumb ? thumb[1] : "" });
  }
  var more = html.indexOf("/search/" + slug + "/" + (page + 1) + "/") >= 0;
  return { items: items, next: chunks.length > 1 && more ? String(page + 1) : null };
}

function field(html, name) {
  var m = html.match(new RegExp("\\b" + name + ":\\s*'([^']*)'"));
  return m ? m[1] : "";
}

function resolve(url) {
  var page = http.page(url);
  var html = page.body;
  var title = util.unescape(field(html, "video_title"));
  if (LGBT.test(title) || LGBT.test(field(html, "video_categories")) || LGBT.test(field(html, "video_tags"))) throw new Error("video unavailable");
  var cap = env.tor ? 720 : 1080;
  var qualities = [];
  var names = ["video_url", "video_alt_url", "video_alt_url2", "video_alt_url3"];
  for (var i = 0; i < names.length; i++) {
    var u = field(html, names[i]);
    if (!u || u.indexOf("http") !== 0) continue;
    var label = field(html, names[i] + "_text");
    var h = parseInt(label, 10);
    if (!(h > 0)) {
      var m = u.match(/_(\d{3,4})p\.mp4/);
      h = m ? parseInt(m[1], 10) : (/_hd\.mp4|single_hd/.test(u) ? 720 : 480);
    }
    qualities.push({ height: h, url: u });
  }
  if (!qualities.length) throw new Error("video unavailable");
  qualities.sort(function (a, b) { return b.height - a.height; });
  var best = qualities[qualities.length - 1];
  for (var j = 0; j < qualities.length; j++) {
    if (qualities[j].height <= cap) { best = qualities[j]; break; }
  }
  return { url: best.url, hls: false, title: title, referer: url, cookie: page.cookies, qualities: qualities };
}
