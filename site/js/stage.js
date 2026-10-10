/* The "climb": a lit field of points that rises from left to right, the
   ratio of its ends set by the clinic's real six-month clicks (7.65k → 48.2k,
   ≈6.3×). The surface between them is illustrative, as the page itself says.
   Plain WebGL, no library. Decorative only (aria-hidden canvas); the numbers
   live in the HTML. Draws itself in on load (construction drawing), turns
   with scroll, rests as a single still frame when motion is off. */
(function () {
  "use strict";
  var canvas = document.querySelector(".gl-stage");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; }

  var motion = window.hsMotion || { still: function () { return matchMedia("(prefers-reduced-motion: reduce)").matches; }, on: function () {} };
  var host = canvas.parentNode;
  var isCase = document.body.classList.contains("pg-case_healthcare_seo");
  var RATIO = 48.2 / 7.65;

  var VS = [
    "attribute vec2 a_uv;",
    "uniform mat4 u_proj, u_view;",
    "uniform float u_time, u_reveal, u_dpr, u_size;", "uniform mediump float u_line;",
    "varying float v_alpha; varying vec3 v_col;",
    "float growth(float u){ float s = smoothstep(0.0, 1.0, u); return (1.0 + (" + (RATIO - 1).toFixed(3) + ") * pow(s, 1.55)) / " + RATIO.toFixed(3) + "; }",
    "void main(){",
    "  float u = a_uv.x, v = a_uv.y;",
    "  float rf = 1.0 - v * 0.5;",
    "  float wob = 0.035 * sin(u * 8.0 + v * 6.0 + u_time * 0.55) * (0.3 + v);",
    "  vec3 p = vec3((u - 0.5) * 2.6, growth(u) * 2.1 * rf + wob - 1.0, -v * 2.6 + 0.5);",
    "  vec4 vp = u_view * vec4(p, 1.0);",
    "  gl_Position = u_proj * vp;",
    "  gl_PointSize = u_size * u_dpr * (1.0 - v * 0.45) / max(0.6, -vp.z) * (1.0 + u_line);",
    "  float edge = smoothstep(u_reveal, u_reveal - 0.06, u);",
    "  float head = exp(-pow((u - u_reveal) * 22.0, 2.0)) * step(u_reveal, 0.999);",
    "  vec3 amber = vec3(0.949, 0.639, 0.227), bone = vec3(0.945, 0.910, 0.855);",
    "  v_col = mix(amber, bone * 0.75, smoothstep(0.0, 0.7, v)) + head * 0.6;",
    "  v_alpha = edge * mix(0.9, 0.16, v) * (0.45 + 0.55 * u) + head * 0.8 * (1.0 - v);",
    "  if (u_line > 0.5) v_alpha = edge * 0.9;",
    "}"
  ].join("\n");
  var FS = [
    "precision mediump float;",
    "varying float v_alpha; varying vec3 v_col;",
    "uniform float u_line, u_dim;",
    "void main(){",
    "  float a = v_alpha * u_dim;",
    "  if (u_line < 0.5) { vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); a *= smoothstep(0.25, 0.05, d); }",
    "  gl_FragColor = vec4(v_col, a);",
    "}"
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
  } catch (e) { if (window.console) console.warn("stage: WebGL unavailable", e && e.message); canvas.remove(); return; }
  gl.useProgram(prog);

  var small = innerWidth < 760;
  var COLS = small ? 90 : 150, ROWS = small ? 22 : 34;
  var pts = new Float32Array(COLS * ROWS * 2), k = 0;
  for (var j = 0; j < ROWS; j++) for (var i = 0; i < COLS; i++) { pts[k++] = i / (COLS - 1); pts[k++] = j / (ROWS - 1); }
  var LINE_N = 240, line = new Float32Array(LINE_N * 2);
  for (var n = 0; n < LINE_N; n++) { line[n * 2] = n / (LINE_N - 1); line[n * 2 + 1] = 0; }
  function buf(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
  var bPts = buf(pts), bLine = buf(line);
  var aUV = gl.getAttribLocation(prog, "a_uv");
  var U = {};
  ["u_proj", "u_view", "u_time", "u_reveal", "u_dpr", "u_size", "u_line", "u_dim"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  function persp(fov, asp, near, far) {
    var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function tr(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }

  var dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  var mx = 0, my = 0, tmx = 0, tmy = 0;
  if (matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", function (e) { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
  }

  var start = performance.now(), reveal = 0, running = false, visible = true, raf = 0;
  function draw(now) {
    var still = motion.still();
    var t = still ? 0 : (now - start) / 1000;
    reveal = still ? 1 : Math.min(1, 1 - Math.pow(1 - Math.min(1, t / 2.2), 3));
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    var hr = host.getBoundingClientRect();
    var sp = Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height)));
    var asp = W / Math.max(1, H), wide = asp > 1.1;
    var yaw = -0.85 + sp * 0.55 + (still ? 0 : mx * 0.12);
    var pitch = 0.5 - sp * 0.22 + (still ? 0 : my * 0.06);
    var offX = wide ? (isCase ? 0.95 : 0.78) : 0.05, offY = wide ? -0.15 : -0.6;
    var view = mul(tr(offX, offY - sp * 0.25, -3.9 - sp * 0.6 + (wide ? 0 : -0.9)), mul(rotX(pitch), rotY(yaw)));
    var proj = persp(wide ? 0.72 : 0.9, asp, 0.1, 50);

    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(U.u_proj, false, new Float32Array(proj));
    gl.uniformMatrix4fv(U.u_view, false, new Float32Array(view));
    gl.uniform1f(U.u_time, t); gl.uniform1f(U.u_reveal, reveal * 1.02);
    gl.uniform1f(U.u_dpr, dpr); gl.uniform1f(U.u_size, small ? 8.0 : 10.0);
    gl.uniform1f(U.u_dim, (isCase ? 0.55 : 1.0) * (wide ? 1 : 0.6));
    gl.enableVertexAttribArray(aUV);

    gl.bindBuffer(gl.ARRAY_BUFFER, bPts); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(U.u_line, 0); gl.drawArrays(gl.POINTS, 0, COLS * ROWS);
    gl.bindBuffer(gl.ARRAY_BUFFER, bLine); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(U.u_line, 1); gl.drawArrays(gl.LINE_STRIP, 0, LINE_N);
  }
  function loop(now) {
    raf = 0;
    draw(now);
    if (running) raf = requestAnimationFrame(loop);
  }
  function setRunning() {
    var want = visible && !document.hidden && !motion.still();
    if (want && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!want) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; requestAnimationFrame(draw); }
  }

  resize();
  addEventListener("resize", function () { resize(); if (!running) requestAnimationFrame(draw); }, { passive: true });
  addEventListener("scroll", function () { if (!running && visible) requestAnimationFrame(draw); }, { passive: true });
  document.addEventListener("visibilitychange", setRunning);
  motion.on(function () { start = performance.now() - 3000; setRunning(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRunning(); }).observe(host);
  }
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; canvas.style.display = "none"; });
  setRunning();
})();
