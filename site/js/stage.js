/* Evidence scenes (plain WebGL, no library). Decorative: the canvas is aria-hidden and
   every number it shows also lives in the HTML.

   Home  ("totals"): two columns of light whose heights are the clinic's real six-month
          organic click totals from Search Console (7.65k previous, 48.2k last), on one
          scale from a common floor. Columns build up on load, sparks rise inside them,
          the camera turns slowly and with scroll.
   Case  ("rank"):   twenty result positions stacked like a search page (page one above,
          page two below). A marker travels from the average position before the work
          (19) to after it (6.5), the figures shown in the case study.

   Runs on phones too (fewer points, capped pixel ratio, paused off-screen). With reduced
   motion (OS setting or the on-page toggle) it draws one deliberate still frame:
   columns complete / marker at 6.5, no camera movement. */
(function () {
  "use strict";
  var canvas = document.querySelector(".gl-stage");
  if (!canvas) return;
  var host = canvas.parentNode;
  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) { host.classList.add("gl-off"); canvas.remove(); return; }

  host.classList.add("gl-on");
  var motion = window.hsMotion || { still: function () { return matchMedia("(prefers-reduced-motion: reduce)").matches; }, on: function () {} };
  var MODE = document.body.classList.contains("pg-case_healthcare_seo") ? "rank" : "totals";
  var small = Math.min(innerWidth, innerHeight) < 700;

  /* ---------- geometry: per point position(3), colour(3), params(4: kind, a, b, c) ---------- */
  var P = [];
  function pt(x, y, z, r, g, b, kind, a, bb, c) { P.push(x, y, z, r, g, b, kind, a || 0, bb || 0, c || 0); }
  var AMBER = [0.949, 0.639, 0.227], BONE = [0.945, 0.910, 0.855], DIM = [0.55, 0.50, 0.44];
  var labels = [];

  if (MODE === "totals") {
    var H = 2.3, before = 7.65, after = 48.2;
    var cols = [
      { x: -0.62, h: H * before / after, c: BONE, label: "Previous 6 months" },
      { x: 0.62, h: H, c: AMBER, label: "Last 6 months" }
    ];
    var ringN = small ? 22 : 34, step = small ? 0.06 : 0.045, R = 0.34;
    cols.forEach(function (col, ci) {
      for (var y = 0; y <= col.h + 1e-6; y += step) {
        for (var k = 0; k < ringN; k++) {
          var a = (k / ringN) * Math.PI * 2 + (y / step % 2) * Math.PI / ringN;
          pt(col.x + Math.cos(a) * R, y, Math.sin(a) * R, col.c[0], col.c[1], col.c[2], 0, col.h);
        }
      }
      // top cap ring, brighter: the total itself
      for (var t = 0; t < ringN * 2; t++) {
        var ang = (t / (ringN * 2)) * Math.PI * 2;
        pt(col.x + Math.cos(ang) * R * 1.12, col.h, Math.sin(ang) * R * 1.12, col.c[0], col.c[1], col.c[2], 3, col.h);
      }
      // sparks rising inside the column
      var sparks = small ? 26 : 50;
      for (var s = 0; s < sparks; s++) {
        var rr = Math.sqrt(Math.random()) * R * 0.8, aa = Math.random() * Math.PI * 2;
        pt(col.x + Math.cos(aa) * rr, 0, Math.sin(aa) * rr, col.c[0], col.c[1], col.c[2], 1, col.h, Math.random(), 0.35 + Math.random() * 0.4);
      }
      labels.push({ text: col.label, x: col.x, y: -0.22, z: 0 });
    });
    // floor: a shared baseline grid, so both columns start from zero
    var F = small ? 18 : 28;
    for (var i = 0; i < F; i++) for (var j = 0; j < F; j++) {
      pt((i / (F - 1) - 0.5) * 3.2, 0, (j / (F - 1) - 0.5) * 2.0, DIM[0], DIM[1], DIM[2], 4, 1e3);
    }
  } else {
    // twenty positions, 1 at the top; a wider gap where page one ends
    var gap = 0.115, pageGap = 0.28, W = 2.0, D = 0.55, nx = small ? 16 : 24, nz = small ? 4 : 5;
    var yOf = function (pos) { return (20 - pos) * gap + (pos <= 10 ? pageGap : 0); };
    for (var p = 1; p <= 20; p++) {
      var col = p <= 10 ? AMBER : BONE, yy = yOf(p);
      for (var ix = 0; ix < nx; ix++) for (var iz = 0; iz < nz; iz++) {
        var edge = ix === 0 || ix === nx - 1 || iz === 0 || iz === nz - 1;
        if (!edge && (ix + iz) % 2) continue; // edges solid, faces half-filled
        pt((ix / (nx - 1) - 0.5) * W, yy, (iz / (nz - 1) - 0.5) * D, col[0], col[1], col[2], 0, 1e3);
      }
    }
    // the marker: a bright ring that travels from 19 to 6.5 (6.5 sits between 6 and 7)
    var from = yOf(19), to = (yOf(6) + yOf(7)) / 2, mN = small ? 40 : 64;
    for (var m = 0; m < mN; m++) {
      var am = (m / mN) * Math.PI * 2;
      pt(Math.cos(am) * 1.2, 0, Math.sin(am) * 0.42, AMBER[0], AMBER[1], AMBER[2], 2, from, to, 1);
      pt(Math.cos(am) * 1.12, 0, Math.sin(am) * 0.36, 1, 0.9, 0.7, 2, from, to, 0.6);
    }
    labels.push({ text: "Before · #19", x: 1.3, y: from, z: 0, cls: "b" });
    labels.push({ text: "After · #6.5", x: 1.3, y: to, z: 0, cls: "a" });
  }
  var COUNT = P.length / 10;

  var VS = [
    "precision highp float;",
    "attribute vec3 a_pos; attribute vec3 a_col; attribute vec4 a_par;",
    "uniform mat4 u_proj, u_view; uniform float u_time, u_grow, u_dpr, u_size, u_marker;",
    "varying vec3 v_col; varying float v_a;",
    "void main(){",
    "  vec3 p = a_pos; float kind = a_par.x; float a = 1.0; float size = u_size;",
    "  if (kind < 0.5) { a = step(p.y, a_par.y * u_grow + 0.001) * 0.85; }",
    "  else if (kind < 1.5) { float h = a_par.y * u_grow; float f = fract(a_par.z + u_time * a_par.w * 0.25);",
    "    p.y = h * f; a = sin(f * 3.14159) * step(0.02, h); size *= 1.5; }",
    "  else if (kind < 2.5) { p.y = mix(a_par.y, a_par.z, u_marker); a = a_par.w; size *= 1.6; }",
    "  else if (kind < 3.5) { a = step(0.97, u_grow); size *= 1.3; }",
    "  else { a = 0.32; size *= 0.7; }",
    "  vec4 vp = u_view * vec4(p, 1.0);",
    "  gl_Position = u_proj * vp;",
    "  gl_PointSize = size * u_dpr / max(0.5, -vp.z);",
    "  v_col = a_col; v_a = a;",
    "}"
  ].join("\n");
  var FS = [
    "precision mediump float;",
    "varying vec3 v_col; varying float v_a;",
    "void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c);",
    "  gl_FragColor = vec4(v_col, v_a * smoothstep(0.25, 0.04, d)); }"
  ].join("\n");
  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { if (window.console) console.warn("stage: WebGL unavailable", e && e.message); host.classList.add("gl-off"); canvas.remove(); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(P), gl.STATIC_DRAW);
  [["a_pos", 3, 0], ["a_col", 3, 3], ["a_par", 4, 6]].forEach(function (a) {
    var loc = gl.getAttribLocation(prog, a[0]); gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, a[1], gl.FLOAT, false, 40, a[2] * 4);
  });
  var U = {};
  ["u_proj", "u_view", "u_time", "u_grow", "u_dpr", "u_size", "u_marker"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.disable(gl.DEPTH_TEST);

  /* ---------- labels (HTML, positioned from the 3D scene) ---------- */
  var labelBox = document.createElement("div");
  labelBox.className = "gl-labels"; labelBox.setAttribute("aria-hidden", "true");
  labels.forEach(function (l) { var e = document.createElement("span"); e.className = "gl-label " + (l.cls || ""); e.textContent = l.text; labelBox.appendChild(e); l.el = e; });
  host.insertBefore(labelBox, canvas.nextSibling);

  /* ---------- maths ---------- */
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }
  function mul(a, b) { var o = new Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function tr(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
  function project(m, x, y, z) {
    var X = m[0] * x + m[4] * y + m[8] * z + m[12], Y = m[1] * x + m[5] * y + m[9] * z + m[13], Wc = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(X / Wc * 0.5 + 0.5) * cw, (1 - (Y / Wc * 0.5 + 0.5)) * ch];
  }
  function ease(x) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3); }

  var dpr = 1, cw = 0, ch = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cw * dpr)); canvas.height = Math.max(1, Math.round(ch * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  var mx = 0, tmx = 0;
  if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", function (e) { tmx = e.clientX / innerWidth - 0.5; }, { passive: true });

  var t0 = performance.now(), running = false, visible = true, raf = 0, frames = 0;
  function draw(now) {
    var still = motion.still();
    var t = (now - t0) / 1000;
    var grow = still ? 1 : ease(t / 1.8);
    var hr = host.getBoundingClientRect();
    var sp = Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height)));
    var marker = still ? 1 : Math.min(1, ease((t - 0.6) / 2.2) * 0.85 + sp * 0.6);
    mx += (tmx - mx) * 0.05;
    var asp = cw / Math.max(1, ch), wide = innerWidth >= 1200;  // matches the side-by-side CSS layout
    var yaw, pitch, dist, ty, fov = wide ? 0.62 : 0.72;
    if (MODE === "totals") {
      yaw = still ? -0.5 : -0.5 + Math.sin(t * 0.18) * 0.35 + sp * 0.9 + mx * 0.3;
      pitch = 0.26 + sp * 0.1; ty = -1.15;
      dist = wide ? 6.4 : Math.max(5.2, 1.45 / (Math.tan(fov / 2) * asp));
    } else {
      yaw = still ? -0.55 : -0.55 + Math.sin(t * 0.2) * 0.3 + sp * 0.6 + mx * 0.3;
      pitch = 0.22; ty = -1.2;
      dist = wide ? 7.6 : Math.max(5.2, 1.35 / (Math.tan(fov / 2) * asp));
    }
    var view = mul(tr(0, 0, -dist), mul(rotX(pitch), mul(rotY(yaw), tr(0, ty, 0))));
    var proj = persp(fov, asp, 0.1, 50);
    proj[8] = wide ? (MODE === "rank" ? -0.42 : -0.5) : 0;  // lens shift: the scene sits in the right half on wide screens
    var vp = mul(proj, view);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(U.u_proj, false, new Float32Array(proj));
    gl.uniformMatrix4fv(U.u_view, false, new Float32Array(view));
    gl.uniform1f(U.u_time, still ? 1.7 : t);
    gl.uniform1f(U.u_grow, grow);
    gl.uniform1f(U.u_marker, marker);
    gl.uniform1f(U.u_dpr, dpr);
    gl.uniform1f(U.u_size, (small ? 16 : 20) * (MODE === "rank" ? 1.15 : 1));
    gl.drawArrays(gl.POINTS, 0, COUNT);
    labels.forEach(function (l) {
      var s = project(vp, l.x, l.y, l.z);
      var side = MODE === "rank" && wide;
      var sx = MODE === "rank" && !wide ? project(vp, 0, l.y, 0) : s;
      l.el.style.transform = "translate(" + sx[0].toFixed(1) + "px," + sx[1].toFixed(1) + "px)" + (side ? " translate(8px,-50%)" : (MODE === "rank" ? " translate(-50%,-150%)" : " translate(-50%,0)"));
      l.el.style.opacity = MODE === "totals" ? (grow > 0.95 ? 1 : 0) : (l.cls === "a" ? (marker > 0.97 ? 1 : 0.35) : 1);
    });
    frames++;
    canvas.setAttribute("data-frames", frames);
  }
  function loop(now) { raf = 0; draw(now); if (running) raf = requestAnimationFrame(loop); }
  function setRunning() {
    var want = visible && !document.hidden && !motion.still();
    if (want && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!want && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    if (!want) requestAnimationFrame(draw);
  }
  resize();
  addEventListener("resize", function () { small = Math.min(innerWidth, innerHeight) < 700; resize(); if (!running) requestAnimationFrame(draw); }, { passive: true });
  addEventListener("scroll", function () { if (!running && visible) requestAnimationFrame(draw); }, { passive: true });
  document.addEventListener("visibilitychange", setRunning);
  motion.on(function () { t0 = performance.now() - (motion.still() ? 0 : 3000); setRunning(); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRunning(); }).observe(host);
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; host.classList.add("gl-off"); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); if (!running) requestAnimationFrame(draw); }).observe(canvas);
  setRunning();
})();
