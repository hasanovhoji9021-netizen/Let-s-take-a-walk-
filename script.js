(function () {
  "use strict";

  /* Номер, на который придёт ответ: 0553 787 767 (Кыргызстан, формат без плюса) */
  var PHONE = "996553787767";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Переключение экранов ---------- */
  var views = ["invite", "thanks", "place", "restaurant", "aravan", "andromed", "done"];
  function show(name) {
    views.forEach(function (v) {
      document.getElementById("v-" + v).hidden = (v !== name);
    });
    if (name === "thanks") typeLines();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) show(t.getAttribute("data-go"));
  });

  /* ---------- Кнопки «Да» и «Нет» ---------- */
  var yes = document.getElementById("yes");
  var no = document.getElementById("no");
  var note = document.getElementById("note");

  var noLabels = ["No", "Are you sure?", "Think again", "Pretty please", "No"];
  var noteLines = [
    "",
    "The No button keeps getting smaller",
    "And Yes keeps growing",
    "No really doesn't want to be pressed",
    "Only one option left"
  ];
  var tries = 0;
  var lastTry = 0;

  function reject(e) {
    if (e && e.cancelable) e.preventDefault();
    if (e) e.stopPropagation();
    if (no.classList.contains("crumble")) return;

    /* одно нажатие вызывает несколько событий (touch, pointer, click), считаем его один раз */
    var now = Date.now();
    if (now - lastTry < 500) return;
    lastTry = now;

    tries++;
    var steps = noLabels.length;

    if (tries >= steps) {
      var r = no.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 18);
      no.classList.add("crumble");
      yes.style.setProperty("--s", "1.25");
      note.textContent = noteLines[steps - 1];
      setTimeout(function () { no.hidden = true; }, 700);
      return;
    }

    no.textContent = noLabels[tries];
    note.textContent = noteLines[tries];
    no.style.setProperty("--s", String(1 - tries * 0.16));
    yes.style.setProperty("--s", String(1 + tries * 0.1));
    no.classList.remove("shrunk"); void no.offsetWidth; no.classList.add("shrunk");
  }

  ["pointerdown", "touchstart", "mousedown", "click"].forEach(function (ev) {
    no.addEventListener(ev, reject, { passive: false });
  });
  no.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") reject(e);
  });

  yes.addEventListener("click", function () {
    var r = yes.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 30);
    setTimeout(function () { show("thanks"); }, 350);
  });

  /* ---------- Сообщение в WhatsApp ---------- */
  var titles = { restaurant: "Restaurant", aravan: "Aravansky", andromed: "Andromed Clinic" };

  function fmtDate(v) {
    if (!v) return "";
    var p = v.split("-");
    return p[2] + "." + p[1] + "." + p[0];
  }
  function read(view) {
    var o = {};
    view.querySelectorAll("[data-f]").forEach(function (i) {
      o[i.getAttribute("data-f")] = i.value.trim();
    });
    return o;
  }
  function build(kind, f) {
    var t = "Hi! I'd love to go out with you 💕\n";
    t += "Place: " + titles[kind] + "\n";
    if (kind === "restaurant") t += "Address: " + (f.addr || "—") + "\n";
    if (f.date) t += "Day: " + fmtDate(f.date) + "\n";
    t += "Time: " + (f.time || "—");
    return t;
  }
  function link(text) {
    return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
  }

  ["restaurant", "aravan", "andromed"].forEach(function (kind) {
    var view = document.getElementById("v-" + kind);
    var send = view.querySelector(".send");
    var err = view.querySelector("[data-err]");

    function refresh() { send.href = link(build(kind, read(view))); }
    view.addEventListener("input", function () { err.textContent = ""; refresh(); });
    refresh();

    send.addEventListener("click", function (e) {
      var f = read(view), msg = "";
      if (kind === "restaurant" && !f.addr) msg = "Please enter the restaurant address.";
      else if (!f.time) msg = "Please choose a meeting time.";

      if (msg) {
        e.preventDefault();
        err.textContent = msg;
        send.classList.remove("shake"); void send.offsetWidth; send.classList.add("shake");
        return;
      }

      refresh();
      var text = build(kind, f);
      document.getElementById("summary").textContent = text.split("\n").slice(1).join(" · ");
      document.getElementById("fallback").href = link(text);
      burst(window.innerWidth / 2, window.innerHeight * 0.6, 30);
      setTimeout(function () { show("done"); }, 500);
    });
  });


  /* ---------- Печатающиеся слова ---------- */
  var typeToken = 0;
  function typeLines() {
    var token = ++typeToken;
    var els = document.querySelectorAll("#v-thanks [data-type]");
    var btn = document.getElementById("thanks-next");
    btn.classList.remove("ready");
    Array.prototype.forEach.call(els, function (el) { el.textContent = ""; el.classList.remove("typing"); });

    if (reduce) {
      Array.prototype.forEach.call(els, function (el) { el.textContent = el.getAttribute("data-type"); });
      btn.classList.add("ready");
      return;
    }
    var li = 0;
    (function next() {
      if (token !== typeToken) return;
      if (li >= els.length) { btn.classList.add("ready"); return; }
      var el = els[li], txt = el.getAttribute("data-type"), i = 0;
      el.classList.add("typing");
      var timer = setInterval(function () {
        if (token !== typeToken) { clearInterval(timer); return; }
        i++;
        el.textContent = txt.slice(0, i);
        if (i >= txt.length) {
          clearInterval(timer);
          el.classList.remove("typing");
          li++;
          setTimeout(next, 450);
        }
      }, 40);
    })();
  }

  /* ---------- Мерцающие звёзды ---------- */
  (function () {
    var box = document.getElementById("stars");
    var n = window.innerWidth < 500 ? 22 : 40;
    for (var i = 0; i < n; i++) {
      var st = document.createElement("span");
      var size = 5 + Math.random() * 10;
      st.className = "star";
      st.style.left = Math.random() * 100 + "%";
      st.style.top = Math.random() * 100 + "%";
      st.style.width = st.style.height = size + "px";
      st.style.setProperty("--d", (2.5 + Math.random() * 3.5).toFixed(1) + "s");
      st.style.setProperty("--delay", (-Math.random() * 6).toFixed(1) + "s");
      box.appendChild(st);
    }
  })();

  /* ---------- Лёгкий наклон карточки за курсором ---------- */
  (function () {
    var card = document.getElementById("card");
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("pointermove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      card.style.transform = "rotateY(" + (x * 4).toFixed(2) + "deg) rotateX(" + (-y * 3).toFixed(2) + "deg)";
    });
    document.addEventListener("pointerleave", function () { card.style.transform = ""; });
  })();

  /* ---------- Сердечки на фоне ---------- */
  var cv = document.getElementById("hearts");
  var ctx = cv.getContext("2d");
  var W = 0, H = 0, dpr = 1, parts = [];
  var palette = ["rgba(234,182,186,", "rgba(227,189,136,", "rgba(179,40,63,", "rgba(143,29,54,"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function falling(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -30,
      s: 6 + Math.random() * 16,
      vx: 0, vy: 0.25 + Math.random() * 0.7,
      sw: Math.random() * Math.PI * 2,
      sp: 0.006 + Math.random() * 0.014,
      amp: 10 + Math.random() * 26,
      a: 0.12 + Math.random() * 0.4,
      c: palette[(Math.random() * palette.length) | 0],
      rot: (Math.random() - 0.5) * 0.8,
      kind: "fall"
    };
  }

  function heart(x, y, s, rot, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s / 16, s / 16);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-18, -6, -8, -18, 0, -8);
    ctx.bezierCurveTo(8, -18, 18, -6, 0, 6);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  /* Салют из сердечек от точки (x, y) */
  function burst(x, y, n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 1.5 + Math.random() * 4.5;
      parts.push({
        x: x, y: y,
        s: 7 + Math.random() * 13,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1.5,
        a: 0.9,
        c: palette[(Math.random() * 3) | 0],
        rot: Math.random() * 6,
        life: 1,
        kind: "burst"
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      if (p.kind === "fall") {
        p.y += p.vy;
        p.sw += p.sp;
        if (p.y > H + 30) { parts[i] = falling(false); continue; }
        heart(p.x + Math.sin(p.sw) * p.amp, p.y, p.s, p.rot + Math.sin(p.sw) * 0.3, p.c + p.a + ")");
      } else {
        p.vy += 0.09;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        heart(p.x, p.y, p.s, p.rot + p.life * 2, p.c + (p.a * p.life).toFixed(2) + ")");
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  resize();
  var count = W < 500 ? 22 : 38;
  for (var i = 0; i < count; i++) parts.push(falling(true));
  window.addEventListener("resize", resize);
  frame();
})();
