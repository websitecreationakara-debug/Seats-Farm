document.documentElement.classList.remove("no-js");

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("nav-open");
      var expanded = header.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll-reveal: fade/slide elements in as they enter the viewport, with a
  // stagger based on position among sibling .reveal elements so grids/rows
  // cascade in rather than popping simultaneously.
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(function (siblings) {
      siblings.forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", Math.min(i * 70, 420) + "ms");
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Count-up animation for stat values that opt in via data-count-to.
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countObserver.unobserve(el);
          var target = parseInt(el.getAttribute("data-count-to"), 10);
          var suffix = el.getAttribute("data-count-suffix") || "";
          var duration = 1100;
          var start = null;
          function step(ts) {
            if (start === null) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  // Slideshows: auto-advance .slideshow__slide children of [data-slideshow]
  // every data-slideshow-interval ms; dots allow jumping to a slide directly.
  document.querySelectorAll("[data-slideshow]").forEach(function (root) {
    var slides = root.querySelectorAll(".slideshow__slide");
    if (slides.length < 2) return;
    var interval = parseInt(root.getAttribute("data-slideshow-interval"), 10) || 30000;
    // The Ken Burns zoom and the dot progress-fill animations must run for
    // exactly one rotation, so the CSS reads the interval from this variable.
    root.style.setProperty("--slideshow-interval", interval + "ms");
    var dotsWrap = root.querySelector(".slideshow__dots");
    var dots = [];
    var current = 0;
    var timer = null;

    function show(i) {
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = i;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].classList.add("is-active");
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        show((current + 1) % slides.length);
      }, interval);
    }

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slideshow__dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", "Show slide " + (i + 1));
        dot.addEventListener("click", function () {
          if (i === current) return;
          show(i);
          restart();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    restart();
  });
});
