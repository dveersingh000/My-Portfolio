(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Theme (dark by default, remembered) */
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  root.setAttribute("data-theme", saved === "light" ? "light" : "dark");

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;

    /* Featured cards: data-featured in the HTML is the public setting.
       Open the page with ?edit to show star toggles (saved in this browser only). */
    var editMode = /[?&]edit(=|&|$)/.test(location.search);
    var featuredStore = {};
    if (/[?&]edit=reset/.test(location.search)) {
      try { localStorage.removeItem("featuredOverrides"); } catch (e) {}
    }
    if (editMode) {
      try { featuredStore = JSON.parse(localStorage.getItem("featuredOverrides") || "{}"); } catch (e) {}
    }

    function refreshFeaturedStat() {
      var n = document.querySelector('.stat-card[data-stat="featured"] .num');
      if (!n) return;
      var count = document.querySelectorAll(".portfolio-block[data-featured]").length;
      n.setAttribute("data-to", count);
      n.textContent = count;
    }

    function cardKey(card, kind) {
      var h = card.querySelector("h5, h4, h3, .title, .text");
      return kind + ":" + (h ? h.textContent.trim().replace(/\s+/g, " ").slice(0, 80) : "");
    }

    function sortFeatured(cards, rebuild) {
      if (!cards.length) return;
      var parent = cards[0].parentNode;
      var $ = window.jQuery;
      var mix = rebuild && $ && $(parent).hasClass("filter-list") && $.fn.mixItUp;
      var filter = "all";
      if (mix) {
        var active = document.querySelector("li.filter.active");
        if (active) filter = active.getAttribute("data-filter") || "all";
        $(parent).mixItUp("destroy");
      }
      cards.slice().sort(function (a, b) {
        var fa = a.hasAttribute("data-featured") ? 0 : 1, fb = b.hasAttribute("data-featured") ? 0 : 1;
        return fa - fb || a._order - b._order;
      }).forEach(function (c) { parent.appendChild(c); });
      if (mix) $(parent).mixItUp({ load: { filter: filter === "all" ? "all" : filter } });
    }

    if (editMode) body.classList.add("fav-edit");

    function setupFeatured(selector, kind) {
      var cards = Array.prototype.slice.call(document.querySelectorAll(selector));
      cards.forEach(function (card, i) {
        card._order = i;
        var key = cardKey(card, kind);
        if (key in featuredStore) {
          if (featuredStore[key]) card.setAttribute("data-featured", "");
          else card.removeAttribute("data-featured");
        }
        card.classList.add("has-fav");
        var box = card.querySelector(".inner-box");
        if (!editMode || !box) return;
        var btn = el("button", "fav-star", "&#9733;");
        btn.type = "button";
        btn.title = "Feature / unfeature (shown first)";
        btn.setAttribute("aria-label", "Toggle featured");
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var on = !card.hasAttribute("data-featured");
          if (on) card.setAttribute("data-featured", ""); else card.removeAttribute("data-featured");
          featuredStore[key] = on;
          try { localStorage.setItem("featuredOverrides", JSON.stringify(featuredStore)); } catch (err) {}
          sortFeatured(cards, true);
          refreshFeaturedStat();
        });
        box.appendChild(btn);
      });
      sortFeatured(cards, true);
    }
    setupFeatured(".portfolio-block", "project");
    setupFeatured(".award-block", "cert");

    (function setupCertToggle() {
      var blocks = Array.prototype.slice.call(document.querySelectorAll(".awards .award-block"));
      var LIMIT = 4;
      if (blocks.length <= LIMIT) return;
      var row = blocks[0].parentNode;
      var btn = el("button", "cert-toggle", "");
      btn.type = "button";
      var expanded = false;
      function render() {
        row.classList.toggle("cert-collapsed", !expanded);
        btn.setAttribute("aria-expanded", expanded);
        btn.innerHTML = expanded
          ? '<span class="fa fa-chevron-up"></span> Collapse'
          : '<span class="fa fa-chevron-down"></span> Show all ' + blocks.length + ' certifications';
      }
      btn.addEventListener("click", function () {
        expanded = !expanded;
        render();
        if (!expanded) row.parentNode.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      var wrap = el("div", "cert-toggle-wrap", "");
      wrap.appendChild(btn);
      row.parentNode.insertBefore(wrap, row.nextSibling);
      render();
    })();

    var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Cinematic slow-motion reveal for the Skills section */
    function skillsCascade(sec, full) {
      var chips = sec.querySelectorAll(".chip");
      var cards = sec.querySelectorAll(".tech-card");
      cards.forEach(function (c, i) { c.style.setProperty("--c", i); });
      chips.forEach(function (c, i) { c.style.setProperty("--i", i); });
      var cls = full ? "magic-on" : "sk-enter";
      sec.classList.remove("magic-on", "sk-enter");
      void sec.offsetWidth;
      sec.classList.add(cls);
      var dur = full ? 9000 : 4200;
      clearTimeout(sec._cascadeT);
      sec._cascadeT = setTimeout(function () { sec.classList.remove(cls); }, dur);
      return dur;
    }

    (function setupMagic() {
      var sec = document.querySelector(".tech-skills");
      if (!sec) return;
      var row = sec.querySelector(".row");
      var bar = el("div", "magic-bar", "");
      var btn = el("button", "see-magic", '<span class="magic-spark">&#10024;</span><span class="magic-label">See magic</span>');
      btn.type = "button";
      btn.setAttribute("aria-label", "Play the skills animation");
      bar.appendChild(btn);
      sec.insertBefore(bar, row);

      var running = false, raf = 0, parts = [], canvas, ctx, last = 0;

      function burst(x, y, n, hue) {
        for (var k = 0; k < n; k++) {
          var a = Math.random() * Math.PI * 2, s = 18 + Math.random() * 60;
          parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0, max: 1.6 + Math.random() * 1.6, r: 1 + Math.random() * 2.2, h: hue + Math.random() * 40 });
        }
      }
      function frame(t) {
        var dt = Math.min((t - last) / 1000, 0.05); last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "lighter";
        parts = parts.filter(function (p) { return p.life < p.max; });
        parts.forEach(function (p) {
          p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 14 * dt; p.vx *= 0.985;
          var k = 1 - p.life / p.max;
          ctx.beginPath();
          ctx.fillStyle = "hsla(" + p.h + ",100%,62%," + (k * 0.9) + ")";
          ctx.shadowColor = "hsla(" + p.h + ",100%,60%,1)";
          ctx.shadowBlur = 12;
          ctx.arc(p.x, p.y, p.r * (0.4 + k), 0, 6.283);
          ctx.fill();
        });
        raf = requestAnimationFrame(frame);
      }

      function play() {
        if (running || reduceMotion) { if (reduceMotion) { sec.classList.remove("sec-collapsed"); } return; }
        running = true;
        btn.disabled = true;
        var wasCollapsed = sec.classList.contains("sec-collapsed");
        sec.classList.remove("sec-collapsed");
        sec.querySelector("h4").setAttribute("aria-expanded", "true");

        var cine = el("div", "cine", '<div class="cine-bar top"><span class="cine-rec"><i></i>REC</span><span class="cine-tag">SLOW MOTION &middot; 0.25&times;</span></div><div class="cine-vignette"></div><div class="cine-bar bottom"><span class="cine-title">Dharamveer Singh &mdash; The Toolkit</span></div>');
        document.body.appendChild(cine);
        requestAnimationFrame(function () { cine.classList.add("in"); });
        sec.scrollIntoView({ behavior: "smooth", block: "center" });

        canvas = el("canvas", "magic-canvas", "");
        sec.appendChild(canvas);
        ctx = canvas.getContext("2d");
        parts = [];

        setTimeout(function () {
          var dur = skillsCascade(sec, true);
          var rect = sec.getBoundingClientRect();
          canvas.width = rect.width; canvas.height = rect.height;
          last = performance.now();
          raf = requestAnimationFrame(frame);
          var hues = [24, 250, 190];
          sec.querySelectorAll(".chip").forEach(function (chip, i) {
            setTimeout(function () {
              var r = chip.getBoundingClientRect(), s = sec.getBoundingClientRect();
              burst(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2, 14, hues[Math.floor(i / 7) % 3] || 24);
            }, 1100 + i * 260 + 700);
          });
          setTimeout(function () {
            cine.classList.remove("in");
            sec.classList.add("magic-finale");
            setTimeout(function () {
              cancelAnimationFrame(raf);
              canvas.remove();
              cine.remove();
              sec.classList.remove("magic-finale");
              btn.disabled = false;
              running = false;
            }, 1400);
          }, dur - 900);
        }, wasCollapsed ? 900 : 1100);
      }
      btn.addEventListener("click", play);
    })();

    document.querySelectorAll(".main-title, .page-title.sec-title, .proficiency > h4, .tech-skills > h4, .languages > h4").forEach(function (title) {
      var section = title.parentNode;
      var isPage = title.classList.contains("page-title");
      var isSub = title.tagName === "H4";
      section.classList.add(isPage ? "sec-collapsible-page" : isSub ? "sec-collapsible-sub" : "sec-collapsible");
      title.classList.add("collapsible-title");
      title.setAttribute("role", "button");
      title.setAttribute("tabindex", "0");
      title.setAttribute("aria-expanded", "true");
      title.appendChild(el("span", "collapse-caret", '<span class="fa fa-chevron-down"></span>'));
      function toggle() {
        var isSkills = section.classList.contains("tech-skills");
        if (isSkills && !section.classList.contains("sec-collapsed")) {
          if (section._busy) return;
          section._busy = true;
          title.setAttribute("aria-expanded", "false");
          if (reduceMotion) { section.classList.add("sec-collapsed"); section._busy = false; return; }
          section.classList.add("sk-leaving");
          setTimeout(function () {
            section.classList.remove("sk-leaving");
            section.classList.add("sec-collapsed");
            section._busy = false;
          }, 1300);
          return;
        }
        var collapsed = section.classList.toggle("sec-collapsed");
        title.setAttribute("aria-expanded", !collapsed);
        if (isSkills && !collapsed && !reduceMotion) skillsCascade(section, false);
      }
      title.addEventListener("click", toggle);
      title.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });


    var pre = document.querySelector(".preloader");
    if (pre) {
      setTimeout(function () {
        pre.style.transition = "opacity .4s";
        pre.style.opacity = "0";
        setTimeout(function () { pre.style.display = "none"; }, 450);
      }, 1200);
    }

    /* Feature cards open the Work section with the matching filter */
    document.querySelectorAll("[data-work-filter]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var filter = document.querySelector(
          'li.filter[data-filter="' + link.getAttribute("data-work-filter") + '"]'
        );
        if (filter) filter.click();
        var work = document.getElementById("work-section");
        if (work) work.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    /* Scroll progress bar */
    var bar = el("div", "scroll-progress");
    body.appendChild(bar);

    /* Floating actions: theme toggle + back to top */
    var actions = el("div", "floating-actions");
    var themeBtn = el("button", "", "");
    themeBtn.id = "themeToggle";
    themeBtn.type = "button";
    themeBtn.setAttribute("aria-label", "Toggle light and dark theme");
    var topBtn = el("button", "", "&#8679;");
    topBtn.id = "toTop";
    topBtn.type = "button";
    topBtn.setAttribute("aria-label", "Back to top");
    actions.appendChild(themeBtn);
    actions.appendChild(topBtn);
    body.appendChild(actions);

    function paintThemeIcon() {
      var dark = root.getAttribute("data-theme") === "dark";
      themeBtn.innerHTML = '<span class="ti">' + (dark ? "&#9728;" : "&#9790;") + '</span><span class="tl">' + (dark ? "Light mode" : "Dark mode") + "</span>";
    }
    paintThemeIcon();

    /* Sticky sidebar: let it scroll with the page until its bottom is reachable */
    var leftBar = document.querySelector(".left-bar");
    function fitSidebar() {
      if (!leftBar) return;
      if (window.innerWidth <= 991) { leftBar.style.top = ""; return; }
      var overflow = window.innerHeight - leftBar.offsetHeight;
      leftBar.style.top = (overflow < 0 ? overflow - 20 : 0) + "px";
    }
    fitSidebar();
    window.addEventListener("resize", fitSidebar);
    window.addEventListener("load", fitSidebar);

    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintThemeIcon();
    });

    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    var ticking = false;
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      topBtn.classList.toggle("show", window.scrollY > 500);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* Cursor glow */
    if (finePointer && !reduceMotion) {
      var glow = el("div", "cursor-glow");
      body.appendChild(glow);
      document.addEventListener("mousemove", function (e) {
        glow.style.opacity = "1";
        glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      });
      document.addEventListener("mouseleave", function () { glow.style.opacity = "0"; });
    }

    /* Typed role line + stats row under the welcome text */
    var welcome = document.querySelector(".welcome");
    if (welcome) {
      var line = el("div", "typed-line", 'I build <span class="typed"></span><span class="caret"></span>');
      welcome.insertBefore(line, welcome.querySelector(".text"));
      var typed = line.querySelector(".typed");
      var roles = ["responsive React.js apps", "scalable Node.js APIs", "cloud-ready deployments", "reliable DevOps pipelines"];
      if (reduceMotion) {
        typed.textContent = roles[0];
      } else {
        var r = 0, c = 0, del = false;
        (function tick() {
          var word = roles[r];
          typed.textContent = word.slice(0, c);
          var wait = del ? 35 : 75;
          if (!del && c === word.length) { del = true; wait = 1600; }
          else if (del && c === 0) { del = false; r = (r + 1) % roles.length; wait = 350; }
          else { c += del ? -1 : 1; }
          setTimeout(tick, wait);
        })();
      }

      var expBlocks = Array.prototype.filter.call(document.querySelectorAll(".experience .edu-block"), function (b) {
        return b.querySelector(".date");
      });
      var years = 0;
      var startDates = expBlocks.map(function (b) {
        var m = b.querySelector(".date").textContent.trim().match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})/);
        return m ? new Date(m[1] + " 1, " + m[2]) : null;
      }).filter(Boolean);
      if (startDates.length) {
        var earliest = Math.min.apply(null, startDates);
        years = Math.floor((Date.now() - earliest) / (365.25 * 24 * 3600 * 1000));
      }
      var certCount = 0;
      document.querySelectorAll(".award-block .inner-box").forEach(function (b) {
        certCount += +b.getAttribute("data-certs") || 1;
      });
      var stats = [
        [years, "+", "Years experience"],
        [new Set(expBlocks.map(function (b) { return (b.querySelector("h5") || {}).textContent; })).size, "", "Companies"],
        [document.querySelectorAll(".portfolio-block[data-featured]").length, "", "Featured projects"],
        [certCount, "", "Certifications"]
      ];
      var row = el("div", "stats-row");
      stats.forEach(function (s) {
        var card = el("div", "stat-card");
        if (s[2] === "Featured projects") card.setAttribute("data-stat", "featured");
        card.innerHTML = '<div class="num" data-to="' + s[0] + '" data-suffix="' + s[1] + '">0' + s[1] + '</div><div class="lbl">' + s[2] + "</div>";
        row.appendChild(card);
      });
      var about = document.querySelector(".about-me");
      if (about) about.parentNode.insertBefore(row, about);
    }

    function countUp(n) {
      var to = +n.getAttribute("data-to");
      var suffix = n.getAttribute("data-suffix") || "";
      if (reduceMotion) { n.textContent = to + suffix; return; }
      var start = null;
      (function step(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / 1200, 1);
        n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }

    /* Reveal on scroll */
    var targets = document.querySelectorAll(
      ".welcome, .stats-row, .prof-card, .tech-card, .skills-column, .expertise-column, .feature-block, .language-block, " +
      ".main-title, .edu-block, .award-block, .expertise-block, .interest-block, .page-title, " +
      ".filters, .info-block, .form-box, .upper-text"
    );
    var io = null;
    if ("IntersectionObserver" in window && !reduceMotion) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          en.target.querySelectorAll(".num[data-to]").forEach(countUp);
          io.unobserve(en.target);
        });
      }, { threshold: 0.12 });
    }
    targets.forEach(function (t, i) {
      if (!io) { t.querySelectorAll(".num[data-to]").forEach(countUp); return; }
      t.classList.add("reveal");
      t.style.setProperty("--d", (i % 3) * 0.08 + "s");
      io.observe(t);
    });

    /* Spotlight hover on cards */
    document.querySelectorAll(
      ".feature-block .inner-box, .edu-block .inner-box, .award-block .inner-box, .expertise-block .inner-box, .prof-card .inner-box, .tech-card .inner-box, .stat-card"
    ).forEach(function (card) {
      card.classList.add("spot");
      card.addEventListener("mousemove", function (e) {
        var b = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - b.left + "px");
        card.style.setProperty("--my", e.clientY - b.top + "px");
      });
    });

  });

  /* Sidebar: typing role rotator + scroll progress */
  document.addEventListener("DOMContentLoaded", function () {
    var rot = document.querySelector(".role-rot");
    if (rot && !reduceMotion) {
      var roles = rot.getAttribute("data-roles").split("|"), ri = 0, ci = roles[0].length, del = true;
      (function tick() {
        var w = roles[ri], delay = del ? 45 : 85;
        ci += del ? -1 : 1;
        rot.textContent = w.slice(0, ci);
        if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; delay = 350; }
        else if (!del && ci === roles[ri].length) { del = true; delay = 1800; }
        setTimeout(tick, delay);
      })();
    }
    var pct = document.querySelector(".side-pct"), bar = document.querySelector(".side-progress .bar i");
    if (pct && bar) {
      var upd = function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(100, Math.max(0, Math.round(window.scrollY / h * 100))) : 0;
        pct.textContent = p + "%";
        bar.style.width = p + "%";
      };
      window.addEventListener("scroll", upd, { passive: true });
      window.addEventListener("resize", upd);
      upd();
    }
  });
})();
