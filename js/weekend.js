(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Bouncing title letters */
  var title = document.getElementById("wkTitle");
  var txt = title.textContent, html = "";
  for (var i = 0; i < txt.length; i++) {
    html += txt[i] === " " ? '<span class="ch sp">&nbsp;</span>' : '<span class="ch" style="--i:' + i + '">' + txt[i] + "</span>";
  }
  title.innerHTML = html;

  /* Typed line */
  var typed = document.getElementById("wkTyped");
  var lines = ["smashing shuttles 🏸", "hunting for great food 🍜", "playing UNO 🃏", "building a side project 💻", "poking at AI 🤖", "out on a bike ride 🏍️", "exploring somewhere new 🗺️"];
  if (reduce) { typed.textContent = lines[0]; }
  else {
    var li = 0, ci = 0, del = false;
    (function tick() {
      var w = Array.from(lines[li]);
      typed.textContent = w.slice(0, ci).join("");
      var wait = del ? 35 : 80;
      if (!del && ci === w.length) { del = true; wait = 1500; }
      else if (del && ci === 0) { del = false; li = (li + 1) % lines.length; wait = 300; }
      else { ci += del ? -1 : 1; }
      setTimeout(tick, wait);
    })();
  }

  /* Floating emoji */
  var fl = document.getElementById("wkFloat");
  var emo = ["🏸", "🍜", "🃏", "🎮", "💻", "🤖", "🏍️", "🗺️", "🍕", "⭐", "🎧", "🍦"];
  if (!reduce) {
    for (var f = 0; f < 22; f++) {
      var s = document.createElement("span");
      s.textContent = emo[f % emo.length];
      s.style.left = Math.random() * 100 + "%";
      s.style.fontSize = 18 + Math.random() * 26 + "px";
      s.style.animationDuration = 14 + Math.random() * 16 + "s";
      s.style.animationDelay = -Math.random() * 28 + "s";
      fl.appendChild(s);
    }
  }

  /* Confetti */
  var cv = document.getElementById("wkConfetti"), cx = cv.getContext("2d"), parts = [], running = false;
  function size() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  size(); window.addEventListener("resize", size);
  var cols = ["#ff3d9a", "#ff8a3d", "#ffd23d", "#29e0ff", "#8a5cff", "#3ddc84"];
  function burst(x, y, n) {
    for (var k = 0; k < n; k++) {
      var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 10;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[k % cols.length], life: 140 + Math.random() * 60 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
  }
  function step() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < cv.height + 40; });
    parts.forEach(function (p) {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life / 40);
      cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
    });
    if (parts.length) requestAnimationFrame(step); else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  function party() {
    if (reduce) return;
    burst(window.innerWidth * 0.2, window.innerHeight * 0.75, 120);
    burst(window.innerWidth * 0.8, window.innerHeight * 0.75, 120);
    setTimeout(function () { burst(window.innerWidth * 0.5, window.innerHeight * 0.4, 160); }, 250);
  }
  document.getElementById("wkParty").addEventListener("click", party);
  title.addEventListener("click", function (e) { burst(e.clientX, e.clientY, 80); });
  setTimeout(party, 700);

  /* Card tilt + spotlight */
  document.querySelectorAll("[data-tilt]").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      if (!reduce) c.style.transform = "perspective(800px) rotateY(" + (x - .5) * 14 + "deg) rotateX(" + (.5 - y) * 14 + "deg) translateY(-6px)";
    });
    c.addEventListener("mouseleave", function () { c.style.transform = ""; });
  });

  /* Timeline */
  var plan = {
    sat: [
      ["6:30 AM", "🏸", "Morning badminton", "Wake up, warm up and smash the sleep away."],
      ["10:00 AM", "🍳", "Big breakfast", "Something I haven't tried before. Tasting notes included."],
      ["1:00 PM", "🗺️", "Go somewhere new", "A new place, a new street, a new cafe."],
      ["5:30 PM", "🏸", "Evening badminton", "Rematch. Winner picks the dinner spot."],
      ["8:30 PM", "🃏", "UNO and online games", "Cards, friends and a lot of draw fours."],
      ["11:30 PM", "🤖", "AI tinkering", "One more prompt, one more experiment."]
    ],
    sun: [
      ["6:30 AM", "🏸", "Morning badminton", "Sunday rally. No scoreboard stress."],
      ["9:30 AM", "🏍️", "Bike ride", "Open roads, cool air and zero traffic."],
      ["1:30 PM", "🍜", "Food trial", "Whatever has a queue outside gets my vote."],
      ["4:00 PM", "💻", "Side project time", "Build something small. Break it. Fix it."],
      ["5:30 PM", "🏸", "Evening badminton", "Last match before Monday shows up."],
      ["9:00 PM", "💛", "Family dinner and chill", "Recharge for the week."]
    ]
  };
  var tl = document.getElementById("wkTimeline");
  function render(day) {
    tl.innerHTML = plan[day].map(function (r, i) {
      return '<li data-ico="' + r[1] + '" style="--i:' + i + '"><time>' + r[0] + "</time><h4>" + r[2] + "</h4><p>" + r[3] + "</p></li>";
    }).join("");
  }
  render("sat");
  document.querySelectorAll(".wk-tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".wk-tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
      render(b.getAttribute("data-day"));
    });
  });

  /* Wheel */
  var opts = [
    ["🏸", "Badminton", "#ffd23d"], ["🗺️", "A new place", "#29e0ff"], ["🍜", "A new dish", "#ff8a3d"], ["🃏", "UNO night", "#ff3d9a"],
    ["💻", "Side project", "#3ddc84"], ["🤖", "AI experiments", "#8a5cff"], ["🏍️", "Bike ride", "#ff5d5d"], ["🎮", "Online games", "#4d7cff"]
  ];
  var wc = document.getElementById("wkWheelCv"), wx = wc.getContext("2d"), N = opts.length, ang = 2 * Math.PI / N;
  (function draw() {
    var R = wc.width / 2;
    opts.forEach(function (o, i) {
      wx.beginPath(); wx.moveTo(R, R); wx.arc(R, R, R - 4, i * ang - Math.PI / 2 - ang / 2, (i + 1) * ang - Math.PI / 2 - ang / 2); wx.closePath();
      wx.fillStyle = o[2]; wx.fill(); wx.strokeStyle = "rgba(11,6,24,.5)"; wx.lineWidth = 3; wx.stroke();
      wx.save(); wx.translate(R, R); wx.rotate(i * ang); wx.textAlign = "center";
      wx.font = "38px sans-serif"; wx.fillText(o[0], 0, -R + 62);
      wx.font = "700 15px Barlow, sans-serif"; wx.fillStyle = "#1a0b2e"; wx.fillText(o[1], 0, -R + 92);
      wx.restore();
    });
  })();
  var spinBtn = document.getElementById("wkSpin"), res = document.getElementById("wkResult"), rot = 0;
  spinBtn.addEventListener("click", function () {
    spinBtn.disabled = true; res.classList.remove("pop"); res.textContent = "Spinning...";
    var pick = Math.floor(Math.random() * N);
    var target = 360 * 6 - pick * (360 / N);
    rot = Math.ceil(rot / 360) * 360 + target;
    wc.style.transform = "rotate(" + rot + "deg)";
    setTimeout(function () {
      res.textContent = opts[pick][0] + " " + opts[pick][1] + "! Decided.";
      void res.offsetWidth; res.classList.add("pop"); spinBtn.disabled = false;
      var r = wc.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 110);
    }, reduce ? 100 : 5100);
  });

  /* Reveal on scroll */
  var rev = document.querySelectorAll(".wk-card, .wk-h, .wk-tabs, .wk-timeline, .wk-wheel-wrap, .wk-result, .wk-meters .m");
  rev.forEach(function (e, i) { e.setAttribute("data-reveal", ""); e.style.setProperty("--d", (i % 4) * 0.08 + "s"); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  rev.forEach(function (e) { io.observe(e); });
})();
