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

      var stats = [[4, "+", "Years experience"], [3, "", "Companies"], [4, "", "Featured projects"], [2, "", "Certifications"]];
      var row = el("div", "stats-row");
      stats.forEach(function (s) {
        var card = el("div", "stat-card");
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

    /* 3D tilt on project cards */
    if (finePointer && !reduceMotion) {
      document.querySelectorAll(".portfolio-block .inner-box").forEach(function (card) {
        card.addEventListener("mousemove", function (e) {
          var b = card.getBoundingClientRect();
          var x = (e.clientX - b.left) / b.width - 0.5;
          var y = (e.clientY - b.top) / b.height - 0.5;
          card.style.transform = "perspective(800px) rotateX(" + (-y * 10) + "deg) rotateY(" + (x * 12) + "deg) translateY(-6px)";
        });
        card.addEventListener("mouseleave", function () { card.style.transform = ""; });
      });
    }
  });
})();
