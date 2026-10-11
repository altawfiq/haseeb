"""Bundle the built site/ into one self-contained offline preview file (not a deploy).

Usage: python3 tools/make_preview.py site <out.html>
Regenerate after every rebuild; the preview is a snapshot of site/."""
import base64, json, mimetypes, os, sys
SITE, OUT = sys.argv[1], sys.argv[2]
PAGES = ["index.html","cases.html","case-healthcare-seo.html","method.html","about.html",
         "diagnostic.html","partners.html","contact.html","privacy.html","404.html"]
LABELS = ["Home","Case studies","Healthcare case study","Method","About","Diagnostic",
          "For agencies","Contact","Privacy","404"]
pages = {p: open(os.path.join(SITE, p), encoding="utf-8").read() for p in PAGES}
files = {}
for root, _, names in os.walk(SITE):
    for n in names:
        full = os.path.join(root, n); rel = os.path.relpath(full, SITE).replace(os.sep, "/")
        if rel.endswith(".html"): continue
        mime = mimetypes.guess_type(n)[0] or ("font/woff2" if n.endswith(".woff2") else "application/octet-stream")
        if n.endswith(".woff2"): mime = "font/woff2"
        if n.endswith(".js"): mime = "text/javascript"
        files[rel] = [mime, base64.b64encode(open(full, "rb").read()).decode()]

shell = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfolio preview</title>
<style>
:root{--bar:#15110C;--fg:#F1E8DA;--dim:#A89F92;--amber:#F2A33A}
html,body{margin:0;height:100%;background:var(--bar)}
body{display:flex;flex-direction:column;font:14px system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg)}
#bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid rgba(241,232,218,.14)}
#bar b{font-weight:600}
#bar .tag{color:var(--dim);font-size:12px}
#bar select,#bar button{font:inherit;color:var(--fg);background:#211A13;border:1px solid rgba(241,232,218,.25);border-radius:999px;padding:6px 12px;cursor:pointer}
#bar button.on{background:var(--amber);color:#15110C;border-color:var(--amber)}
#bar .sp{flex:1}
#stage{flex:1;display:flex;justify-content:center;background:#0d0a07;min-height:0}
#frame{border:0;width:100%;height:100%;background:#15110C;transition:width .2s}
#stage.mobile #frame{width:390px;max-width:100%;border-left:1px solid #333;border-right:1px solid #333}
@media (prefers-color-scheme: light){:root{}}
</style></head><body>
<div id="bar">
  <b>Portfolio preview</b><span class="tag">local, offline copy of site/ — not deployed</span>
  <span class="sp"></span>
  <label for="pg" class="tag">Page</label>
  <select id="pg"></select>
  <button id="back" type="button" aria-label="Back">&larr;</button>
  <button id="vd" type="button" class="on">Desktop</button>
  <button id="vm" type="button">Mobile width</button>
</div>
<div id="stage"><iframe id="frame" title="Site preview"></iframe></div>
<script>
var PAGES = __PAGES__, LABELS = __LABELS__, FILES = __FILES__;
var urls = {};
function text(b64){return new TextDecoder().decode(Uint8Array.from(atob(b64),function(c){return c.charCodeAt(0);}));}
Object.keys(FILES).forEach(function(p){ if(!/\.css$/.test(p)) urls[p]="data:"+FILES[p][0]+";base64,"+FILES[p][1]; });
Object.keys(FILES).forEach(function(p){ if(/\.css$/.test(p)){ var css=text(FILES[p][1]).replace(/url\(\.\.\/([^)]+)\)/g,function(m,r){return "url("+(urls[r]||r)+")";}); urls[p]="data:text/css;charset=utf-8,"+encodeURIComponent(css); } });
var NAV = "<script>(function(){document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');var m=h.match(/^([\\w-]+\\.html)?(#[\\w-]*)?$/);if(!m)return;if(!m[1]&&m[2]){e.preventDefault();var t=m[2].length>1&&document.getElementById(m[2].slice(1));if(t)t.scrollIntoView({behavior:'smooth'});else scrollTo(0,0);return;}e.preventDefault();parent.postMessage({nav:m[1],hash:m[2]||''},'*');},true);})();<\/script>";
var pageCache = {}, history_ = [], current = null, pendingHash = "";
function pageHTML(name){
  if(pageCache[name]) return pageCache[name];
  var html = PAGES[name].replace(/(\s(?:src|href|data-cert)=")((?:assets|images|css|js|fonts)\/[^"#?]+|favicon\.png|apple-touch-icon\.png|share\.jpg)(")/g,function(m,a,p,z){return a+(urls[p]||p)+z;});
  html = html.replace(/<head>/i, "<head>"+NAV);
  return pageCache[name] = html;
}
var frame=document.getElementById("frame"), sel=document.getElementById("pg");
Object.keys(PAGES).forEach(function(p,i){var o=document.createElement("option");o.value=p;o.textContent=LABELS[i]+" — "+p;sel.appendChild(o);});
function go(name, hash, push){
  if(!PAGES[name]) name="404.html";
  if(push!==false && current) history_.push(current);
  current=name; sel.value=name;
  pendingHash = hash||"";
  frame.srcdoc = pageHTML(name);
}
frame.addEventListener("load",function(){ if(!pendingHash) return; try{ var t=frame.contentDocument.getElementById(pendingHash.slice(1)); if(t) t.scrollIntoView(); }catch(e){} pendingHash=""; });
window.addEventListener("message",function(e){ if(e.data&&("nav" in e.data)) go(e.data.nav||current, e.data.hash); });
sel.addEventListener("change",function(){go(sel.value);});
document.getElementById("back").addEventListener("click",function(){ if(history_.length) go(history_.pop(),"",false); });
var vd=document.getElementById("vd"), vm=document.getElementById("vm"), stage=document.getElementById("stage");
vd.onclick=function(){stage.classList.remove("mobile");vd.classList.add("on");vm.classList.remove("on");};
vm.onclick=function(){stage.classList.add("mobile");vm.classList.add("on");vd.classList.remove("on");};
go("index.html");
</script></body></html>"""
esc = lambda o: json.dumps(o).replace("</", "<\\/")
out = (shell.replace("__PAGES__", esc(pages))
            .replace("__LABELS__", esc(LABELS))
            .replace("__FILES__", esc(files)))
open(OUT, "w", encoding="utf-8").write(out)
print(OUT, round(len(out)/1e6, 2), "MB")
