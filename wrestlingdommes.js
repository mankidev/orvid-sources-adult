var SITE = "https://www.wrestlingdommes.com";
var LGBT = /\b(lezdom\w*|lez|lezzy|lesbi\w*|lesbo\w*|girl on girl|girls on girls|sapphic|trans|transgender|transsexual|tranny|shemale\w*|tgirl\w*|sissy\w*|gay|futa\w*|crossdress\w*)\b/i;

function call(html, name) {
  var m = html.match(new RegExp(name + "\\('([^']*)'\\)"));
  return m ? m[1] : "";
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var q = encodeURIComponent(query);
  var html = http.get(page > 1 ? SITE + "/page/" + page + "/?s=" + q : SITE + "/?s=" + q);
  var chunks = html.split("<article data-video-id");
  var items = [];
  for (var i = 1; i < chunks.length; i++) {
    var c = chunks[i];
    var href = c.match(/<a href="(https:\/\/www\.wrestlingdommes\.com\/\d{4}\/\d{2}\/\d{2}\/[^"]+)" title="([^"]*)"/);
    if (!href) continue;
    var title = util.unescape(href[2]).trim();
    if (!title || LGBT.test(title) || /\btag-[a-z0-9-]*(lesbian|lezdom|lesbo|transgender|shemale)/.test(c)) continue;
    var thumb = c.match(/data-main-thumb="([^"]+)"/);
    var dur = c.match(/class="duration"><i[^>]*><\/i>\s*([0-9:]+)/);
    var views = c.match(/class="views"><i[^>]*><\/i>\s*([0-9]+)/);
    items.push({ url: href[1], title: title,
      duration: dur ? util.duration(dur[1]) : -1,
      views: views ? parseInt(views[1], 10) : -1,
      thumb: thumb ? thumb[1] : "" });
  }
  var more = html.indexOf(SITE + "/page/" + (page + 1) + "/") >= 0;
  return { items: items, next: chunks.length > 1 && more ? String(page + 1) : null };
}

function xnxx(embed, title) {
  var html = http.get(embed);
  var hls = call(html, "setVideoHLS");
  var mp4 = call(html, "setVideoUrlHigh") || call(html, "setVideoUrlLow");
  if (!hls && !mp4) throw new Error("video unavailable");
  var out = { url: hls || mp4, hls: !!hls, title: title || util.unescape(call(html, "setVideoTitle")) };
  if (hls && mp4) out.fallback = { url: mp4, hls: false };
  return out;
}

function resolve(url) {
  var html = http.get(url);
  var t = html.match(/<h1 class="entry-title">([^<]+)/);
  var title = t ? util.unescape(t[1]).trim() : "";
  var px = html.match(/player-x\.php\?q=([A-Za-z0-9+\/=%]+)/);
  if (px) {
    var tag = decodeURIComponent(util.base64(decodeURIComponent(px[1])));
    var src = tag.match(/<source[^>]*src="([^"]+\.(?:mp4|m3u8)[^"]*)"/);
    if (src) return { url: src[1].replace("://wrestlingdommes.com/", "://www.wrestlingdommes.com/"), hls: /\.m3u8/.test(src[1]), title: title, referer: SITE + "/" };
    var inner = tag.match(/<iframe[^>]*src="(https:\/\/www\.(?:xnxx|xvideos)\.com\/embedframe\/[A-Za-z0-9]+)"/);
    if (inner) return xnxx(inner[1], title);
  }
  var ifr = html.match(/<iframe[^>]*src="(https:\/\/www\.(?:xnxx|xvideos)\.com\/embedframe\/[A-Za-z0-9]+)"/);
  if (ifr) return xnxx(ifr[1], title);
  throw new Error("unsupported player");
}
