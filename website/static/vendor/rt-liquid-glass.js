(function () {
  var RT_NS = "rtLiquidGlass";
  if (window[RT_NS] && window[RT_NS].__initialized) return;

  function getAttrFrom(el, name) {
    if (!el) return null;
    if (!el.hasAttribute(name)) return null;
    return el.getAttribute(name);
  }

  function getAttr(name) {
    var html = document.documentElement;
    var body = document.body;
    var v = getAttrFrom(html, name);
    if (v !== null) return v;
    v = getAttrFrom(body, name);
    if (v !== null) return v;
    return null;
  }

  function hasAttrAnywhere(name) {
    var html = document.documentElement;
    var body = document.body;
    if (html && html.hasAttribute(name)) return true;
    if (body && body.hasAttribute(name)) return true;
    return false;
  }

  function parseBool(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim().toLowerCase();
    if (s === "") return true;
    if (s === "true" || s === "1" || s === "yes" || s === "y" || s === "on")
      return true;
    if (s === "false" || s === "0" || s === "no" || s === "n" || s === "off")
      return false;
    return def;
  }

  function parseNum(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v).trim();
    if (!s.length) return def;
    var n = Number(s);
    return Number.isFinite(n) ? n : def;
  }

  function parseStr(v, def) {
    if (v === null || v === undefined) return def;
    var s = String(v);
    return s.length ? s : def;
  }

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function safeCSSSupports(prop, value) {
    try {
      if (!window.CSS || typeof CSS.supports !== "function") return false;
      return CSS.supports(prop, value);
    } catch (e) {
      return false;
    }
  }

  function isFirefoxUA() {
    try {
      return (
        String(navigator.userAgent || "")
          .toLowerCase()
          .indexOf("firefox") > -1
      );
    } catch (e) {
      return false;
    }
  }

  function isAttrPresent(v) {
    return v !== null && v !== undefined;
  }

  function readOptions(getLocal) {
    var prefix = "rt-liquid-glass-";

    function localOrGlobal(name) {
      var v = getLocal(name);
      if (isAttrPresent(v)) return v;
      return getAttr(name);
    }

    function getRaw(name) {
      return localOrGlobal(prefix + name);
    }

    function hasRaw(name) {
      return isAttrPresent(getRaw(name));
    }

    var opts = {};

    if (hasRaw("blur")) opts.blur = parseNum(getRaw("blur"), undefined);
    if (hasRaw("scale")) opts.scale = parseNum(getRaw("scale"), undefined);
    if (hasRaw("map")) opts.map = parseNum(getRaw("map"), undefined);

    // New Custom Attributes
    if (hasRaw("tint")) opts.tint = parseStr(getRaw("tint"), undefined);
    if (hasRaw("edge-thickness"))
      opts.edgeThickness = parseNum(getRaw("edge-thickness"), undefined);
    if (hasRaw("edge-softness"))
      opts.edgeSoftness = parseNum(getRaw("edge-softness"), undefined);

    if (hasRaw("reveal")) {
      var revealRaw = getRaw("reveal");
      var s = String(revealRaw || "").trim();
      if (s === "" || s.toLowerCase() === "true") {
        opts.reveal = true;
      } else if (s.toLowerCase() === "false") {
        opts.reveal = false;
      } else {
        opts.reveal = true;
        opts.revealDuration = s;
      }
    }

    if (hasRaw("disable-firefox"))
      opts.disableFirefox = parseBool(getRaw("disable-firefox"), true);
    if (hasRaw("fallback-blur"))
      opts.fallbackBlur = parseNum(getRaw("fallback-blur"), undefined);
    if (hasRaw("base-bg")) opts.baseBg = parseStr(getRaw("base-bg"), "");
    if (hasRaw("transition-ms"))
      opts.transitionMs = parseNum(getRaw("transition-ms"), undefined);
    if (hasRaw("observe-threshold"))
      opts.observeThreshold = parseNum(getRaw("observe-threshold"), undefined);
    if (hasRaw("observe-root-margin")) {
      var rm = parseStr(getRaw("observe-root-margin"), "");
      if (rm) opts.observeRootMargin = rm;
    }

    return opts;
  }

  function init() {
    var enabledRoot = hasAttrAnywhere("rt-liquid-glass");
    var nodes = document.querySelectorAll("[rt-liquid-glass]");
    var hasNodes = nodes && nodes.length > 0;

    var shouldRun = enabledRoot || hasNodes;
    if (!shouldRun) return;

    var supportsBackdrop =
      safeCSSSupports("backdrop-filter", "none") ||
      safeCSSSupports("-webkit-backdrop-filter", "none");

    var disableFirefox = parseBool(
      getAttr("rt-liquid-glass-disable-firefox"),
      true,
    );
    var isFirefox = isFirefoxUA();
    var enableLiquidEffect = supportsBackdrop && !(disableFirefox && isFirefox);

    var baseBg =
      parseStr(getAttr("rt-liquid-glass-base-bg"), "") ||
      "rgba(255, 255, 255, 0.025)";
    var transitionMs = parseNum(getAttr("rt-liquid-glass-transition-ms"), 300);
    var observeThreshold = parseNum(
      getAttr("rt-liquid-glass-observe-threshold"),
      0.15,
    );
    observeThreshold = clamp(observeThreshold, 0, 1);
    var observeRootMargin =
      parseStr(getAttr("rt-liquid-glass-observe-root-margin"), "") || "0px";

    var style = document.createElement("style");

    style.innerHTML =
      "\n[rt-liquid-glass]{" +
      "\n  background-color: var(--rt-liquid-tint, " +
      baseBg +
      ");" +
      "\n  will-change: transform, backdrop-filter;" +
      "\n  transition:backdrop-filter " +
      transitionMs +
      "ms ease,-webkit-backdrop-filter " +
      transitionMs +
      "ms ease,opacity " +
      transitionMs +
      "ms ease, background-color " +
      transitionMs +
      "ms ease;" +
      "\n}" +
      '\n[rt-liquid-glass="false"]{' +
      "\n  backdrop-filter:none;" +
      "\n  -webkit-backdrop-filter:none;" +
      "\n  background-color:transparent;" +
      "\n}" +
      "\n[rt-liquid-glass].rt-reveal-hidden{" +
      "\n  opacity:0;" +
      "\n  transition:opacity 0s;" +
      "\n}" +
      "\n[rt-liquid-glass].rt-reveal-visible{" +
      "\n  opacity:1;" +
      "\n  transition:opacity var(--rt-reveal-duration, 1.0s) ease;" +
      "\n}";

    if (enableLiquidEffect) {
      style.innerHTML +=
        "\n[rt-liquid-glass]{" +
        "\n  -webkit-backdrop-filter:var(--rt-liquid-final-filter, none);" +
        "\n  backdrop-filter:var(--rt-liquid-final-filter, none);" +
        "\n}";
    } else {
      style.innerHTML +=
        "\n[rt-liquid-glass]{" +
        "\n  -webkit-backdrop-filter:blur(var(--rt-fallback-blur, 10px));" +
        "\n  backdrop-filter:blur(var(--rt-fallback-blur, 10px));" +
        "\n}";
    }

    document.head.appendChild(style);

    var svgContainer = null;
    if (enableLiquidEffect) {
      svgContainer = document.createElement("div");
      svgContainer.style.cssText =
        "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
      document.body.appendChild(svgContainer);
    }

    var observerOptions = {
      root: null,
      threshold: observeThreshold,
      rootMargin: observeRootMargin,
    };
    var revealObserver = null;
    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(function (entries, observer) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (!entry.isIntersecting) continue;
          var el = entry.target;
          el.classList.remove("rt-reveal-hidden");
          el.classList.add("rt-reveal-visible");
          observer.unobserve(el);
        }
      }, observerOptions);
    }

    var resizeObserver = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var el = entry.target;
          var idx = el.getAttribute("data-rt-idx");
          if (idx !== null) {
            var opts = buildPerElOptions(el);
            if (enableLiquidEffect) applyLiquid(el, idx, opts);
          }
        }
      });
    }

    function createDisplacementMap(
      width,
      height,
      radius,
      edgeThickness,
      edgeSoftness,
    ) {
      var strokeWidth = Math.min(width, height) * edgeThickness;
      var blurStd = strokeWidth * edgeSoftness;
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        width +
        '" height="' +
        height +
        '" viewBox="0 0 ' +
        width +
        " " +
        height +
        '">' +
        "<defs>" +
        '<linearGradient id="gradX" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#000000" />' +
        '<stop offset="100%" stop-color="#ff0000" />' +
        "</linearGradient>" +
        '<linearGradient id="gradY" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#000000" />' +
        '<stop offset="100%" stop-color="#00ff00" />' +
        "</linearGradient>" +
        '<filter id="blurEdge">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="' +
        blurStd +
        '" />' +
        "</filter>" +
        "</defs>" +
        '<rect width="100%" height="100%" fill="url(#gradX)" />' +
        '<rect width="100%" height="100%" fill="url(#gradY)" style="mix-blend-mode: screen;" />' +
        '<rect x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" rx="' +
        radius +
        '" ry="' +
        radius +
        '" fill="none" stroke="#808080" stroke-width="' +
        strokeWidth * 2 +
        '" filter="url(#blurEdge)" />' +
        "</svg>"
      );
    }

    function getBorderRadiusPx(el) {
      try {
        var cs = getComputedStyle(el);
        var br = cs ? cs.borderTopLeftRadius : "";
        var n = parseFloat(br);
        return Number.isFinite(n) ? n : 0;
      } catch (e) {
        return 0;
      }
    }

    function ensureMeasuredSize(el) {
      var rect = null;
      try {
        rect = el.getBoundingClientRect();
      } catch (e) {
        rect = null;
      }
      var w = rect && rect.width ? rect.width : el.offsetWidth || 0;
      var h = rect && rect.height ? rect.height : el.offsetHeight || 0;
      return { w: w, h: h };
    }

    function applyReveal(el, opts) {
      if (!opts || !opts.reveal) return;
      if (opts.revealDuration)
        el.style.setProperty("--rt-reveal-duration", opts.revealDuration);
      if (revealObserver) {
        el.classList.add("rt-reveal-hidden");
        revealObserver.observe(el);
      } else {
        el.classList.remove("rt-reveal-hidden");
        el.classList.add("rt-reveal-visible");
      }
    }

    function applyFallback(el, opts) {
      var blur = opts && typeof opts.blur === "number" ? opts.blur : 0;
      var fallbackBlur =
        opts && typeof opts.fallbackBlur === "number" ? opts.fallbackBlur : 10;
      var finalBlur = blur > 0 ? blur : fallbackBlur;
      finalBlur = clamp(finalBlur, 0, 200);
      el.style.setProperty("--rt-fallback-blur", finalBlur + "px");
      if (opts.tint) el.style.setProperty("--rt-liquid-tint", opts.tint);
    }

    function applyLiquid(el, idx, opts) {
      if (!svgContainer) return;

      var blur = opts && typeof opts.blur === "number" ? opts.blur : 0;
      var scale = opts && typeof opts.scale === "number" ? opts.scale : 30;
      var mapQ = opts && typeof opts.map === "number" ? opts.map : null;
      var eThick =
        opts && typeof opts.edgeThickness === "number"
          ? opts.edgeThickness
          : 0.15;
      var eSoft =
        opts && typeof opts.edgeSoftness === "number" ? opts.edgeSoftness : 0.5;

      blur = clamp(blur, 0, 200);
      scale = clamp(scale, 0, 300);

      var size = ensureMeasuredSize(el);
      var elWidth = size.w;
      var elHeight = size.h;

      if (!elWidth || !elHeight) {
        applyFallback(el, opts);
        return;
      }

      var elRadius = getBorderRadiusPx(el);
      var mapWidth = elWidth;
      var mapHeight = elHeight;
      var mapRadius = elRadius;

      if (mapQ && mapQ > 0 && mapQ < Math.max(elWidth, elHeight)) {
        var ratio = mapQ / Math.max(elWidth, elHeight);
        mapWidth = Math.max(1, Math.floor(elWidth * ratio));
        mapHeight = Math.max(1, Math.floor(elHeight * ratio));
        mapRadius = elRadius * ratio;
      } else {
        mapWidth = Math.max(1, Math.floor(mapWidth));
        mapHeight = Math.max(1, Math.floor(mapHeight));
      }

      var uniqueId = "rt-liquid-" + idx;
      var mapSvgString = createDisplacementMap(
        mapWidth,
        mapHeight,
        mapRadius,
        eThick,
        eSoft,
      );
      var mapUrl =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(mapSvgString);

      var fX = -Math.floor(elWidth * 0.2);
      var fY = -Math.floor(elHeight * 0.2);
      var fW = Math.floor(elWidth * 1.4);
      var fH = Math.floor(elHeight * 1.4);

      var filterSvg = document.getElementById("svg-" + uniqueId);
      if (!filterSvg) {
        filterSvg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        filterSvg.setAttribute("id", "svg-" + uniqueId);
        svgContainer.appendChild(filterSvg);
      }

      filterSvg.innerHTML =
        '\n<filter id="filter-' +
        uniqueId +
        '" filterUnits="userSpaceOnUse" x="' +
        fX +
        '" y="' +
        fY +
        '" width="' +
        fW +
        '" height="' +
        fH +
        '" color-interpolation-filters="sRGB">' +
        '\n  <feImage href="' +
        mapUrl +
        '" result="dispMap" x="0" y="0" width="' +
        mapWidth +
        '" height="' +
        mapHeight +
        '" preserveAspectRatio="none" />' +
        '\n  <feDisplacementMap in="SourceGraphic" in2="dispMap" scale="' +
        scale +
        '" xChannelSelector="R" yChannelSelector="G" />' +
        "\n</filter>";

      var blurPart = blur > 0 ? " blur(" + blur + "px)" : "";
      var urlPart = "url(#filter-" + uniqueId + ")";

      el.style.setProperty("--rt-liquid-final-filter", urlPart + blurPart);
      if (opts.tint) el.style.setProperty("--rt-liquid-tint", opts.tint);
    }

    function shouldDisableEl(el) {
      return getAttrFrom(el, "rt-liquid-glass") === "false";
    }

    function buildPerElOptions(el) {
      var opts = readOptions(function (name) {
        return getAttrFrom(el, name);
      });
      if (typeof opts.blur !== "number") opts.blur = 0;
      if (typeof opts.scale !== "number") opts.scale = 30;
      if (opts.map === undefined) opts.map = null;
      if (opts.reveal === undefined) {
        var rawReveal = getAttrFrom(el, "rt-liquid-glass-reveal");
        opts.reveal = rawReveal !== null && rawReveal !== "false";
        if (opts.reveal && rawReveal !== "" && rawReveal !== "true") {
          opts.revealDuration = rawReveal;
        }
      }
      return opts;
    }

    function makeApi() {
      return {
        __initialized: true,
        refresh: function () {
          if (svgContainer) svgContainer.innerHTML = "";
          var els = document.querySelectorAll("[rt-liquid-glass]");
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (shouldDisableEl(el)) continue;
            el.setAttribute("data-rt-idx", i);
            var opts = buildPerElOptions(el);
            applyReveal(el, opts);
            if (!enableLiquidEffect) {
              applyFallback(el, opts);
            } else {
              applyLiquid(el, i, opts);
              if (resizeObserver) resizeObserver.observe(el);
            }
          }
        },
      };
    }

    var api = makeApi();
    window[RT_NS] = api;
    api.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
