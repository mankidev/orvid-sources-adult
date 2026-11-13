var SITE = "https://femdomehub.com";
var LGBT = /\b(lezdom\w*|lez|lezzy|lesbi\w*|lesbo\w*|girl on girl|girls on girls|sapphic|trans|transgender|transsexual|tranny|shemale\w*|tgirl\w*|sissy\w*|gay|futa\w*|crossdress\w*)\b/i;
var UA = { "Accept": "application/json, text/javascript, */*; q=0.01", "X-Requested-With": "XMLHttpRequest" };

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var q = encodeURIComponent(query);
  var html = http.get(page > 1 ? SITE + "/page/" + page + "/?s=" + q : SITE + "/?s=" + q);
  var chunks = html.split('<li class="thumi">');
  var items = [];
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i];
    var href = c.match(/href="(https:\/\/femdomehub\.com\/\d+\/[^"]+)"/);
    var title = c.match(/title="([^"]+)"/);
    if (!href || !title || LGBT.test(title[1])) continue;
    var thumb = c.match(/src="(https?:\/\/[^"]+\.(?:webp|jpg|png))"/);
    var dur = c.match(/fa-clock"><\/i>\s*([0-9:]+)/);
    var views = c.match(/fa-eye"><\/i>\s*([0-9]+)/);
    items.push({ url: href[1], title: util.unescape(title[1]),
      duration: dur ? util.duration(dur[1]) : -1,
      views: views ? parseInt(views[1], 10) : -1,
      thumb: thumb ? thumb[1] : "" });
  }
  var more = html.indexOf('class="next page-numbers"') >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function nuvid(embed, title) {
  var page = http.get(embed);
  var vid = page.match(/vid:\s*(\d+)/);
  if (!vid) throw new Error("video unavailable");
  var cfg = http.json("https://www.nuvid.com/player_config_json/?vid=" + vid[1] + "&aid=0&domain_id=0&embed=0&check_speed=0", UA);
  var files = cfg.files || {};
  var cap = env.tor ? "lq" : "hq";
  var url = files[cap] || files.hq || files.lq;
  if (!url) throw new Error("video unavailable");
  var out = { url: url, hls: false, title: title || cfg.title || "" };
  if (files.hq && files.lq && url === files.hq) out.fallback = { url: files.lq, hls: false };
  return out;
}

function eporner(id, title) {
  var page = "https://www.eporner.com/video-" + id + "/";
  var html = http.get(page);
  var cap = env.tor ? 720 : 1080, best = -1, file = null;
  var re = /href="(\/dload\/[^"]+-(\d+)p\.mp4)"/g, m;
  while ((m = re.exec(html))) {
    var h = parseInt(m[2], 10);
    if (h <= cap && h > best) {
      best = h;
      file = "https://www.eporner.com" + m[1];
    }
  }
  if (!file) throw new Error("video unavailable");
  var cdn = http.check(file, { Referer: page }).location;
  return { url: cdn || file, hls: false, title: title };
}

function resolve(url) {
  var html = http.get(url);
  var t = html.match(/<h1 class="singletitle">\s*([^<]+)/);
  var title = t ? util.unescape(t[1]).trim() : "";
  var nv = html.match(/<iframe[^>]*src="(https:\/\/nvdvid\.com\/e\/[A-Za-z0-9]+)"/);
  if (nv) return nuvid(nv[1], title);
  var ep = html.match(/<iframe[^>]*src="https:\/\/www\.eporner\.com\/embed\/([A-Za-z0-9]+)\/?"/);
  if (ep) return eporner(ep[1], title);
  throw new Error("unsupported player");
}
