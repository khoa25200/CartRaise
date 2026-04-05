/**
 * Conversion Booster Lite — theme snippet
 * Usage:
 * <script src="https://YOUR_APP_URL/scripts/storefront.js" defer
 *   data-app-url="https://YOUR_APP_URL"
 *   data-shop="store.myshopify.com"
 *   data-gift-variant="VARIANT_ID"
 * ></script>
 */
(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector("script[data-cbl-storefront]");
  if (!script) return;

  var appUrl = (script.getAttribute("data-app-url") || "").replace(/\/$/, "");
  var shop = (script.getAttribute("data-shop") || "").trim().toLowerCase();
  var giftVariantId = (script.getAttribute("data-gift-variant") || "").trim();
  if (!appUrl || !shop) return;

  var BAR_ID = "cbl-progress-root";
  var debounceTimer = null;
  var inFlight = false;

  function schedule(fn) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, 320);
  }

  function ensureBar() {
    var el = document.getElementById(BAR_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = BAR_ID;
    el.setAttribute("data-cbl-bar", "1");
    el.style.cssText =
      "margin:12px 0;padding:10px 12px;border-radius:8px;background:#f6f6f7;font:14px system-ui,-apple-system,sans-serif;";
    var wrap = document.createElement("div");
    wrap.style.cssText = "height:8px;background:#e3e3e3;border-radius:4px;overflow:hidden;margin-top:8px;";
    var fill = document.createElement("div");
    fill.setAttribute("data-cbl-fill", "1");
    fill.style.cssText = "height:100%;width:0%;background:#008060;transition:width 0.25s ease;";
    wrap.appendChild(fill);
    var msg = document.createElement("div");
    msg.setAttribute("data-cbl-msg", "1");
    el.appendChild(msg);
    el.appendChild(wrap);
    var cartForms = document.querySelectorAll("form[action*='/cart']");
    var anchor = cartForms.length ? cartForms[0] : document.body;
    anchor.parentNode.insertBefore(el, anchor);
    return el;
  }

  function setBar(progress, message) {
    var root = ensureBar();
    var msg = root.querySelector("[data-cbl-msg]");
    var fill = root.querySelector("[data-cbl-fill]");
    if (msg) msg.textContent = message || "";
    if (fill) fill.style.width = Math.max(0, Math.min(100, progress)) + "%";
  }

  function hideBar() {
    var el = document.getElementById(BAR_ID);
    if (el) el.remove();
  }

  function parseCartTotalDollars(cart) {
    if (!cart || cart.total_price == null) return 0;
    var cents = parseInt(String(cart.total_price), 10);
    if (!Number.isFinite(cents)) return 0;
    return cents / 100;
  }

  function findGiftLine(cart) {
    if (!cart || !Array.isArray(cart.items) || !giftVariantId) return null;
    for (var i = 0; i < cart.items.length; i++) {
      if (String(cart.items[i].variant_id) === String(giftVariantId)) {
        return cart.items[i];
      }
    }
    return null;
  }

  function fetchCart() {
    return fetch("/cart.js", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    }).then(function (r) {
      if (!r.ok) throw new Error("cart");
      return r.json();
    });
  }

  function postJson(url, body) {
    var crossApp = typeof url === "string" && url.indexOf(appUrl) === 0;
    return fetch(url, {
      method: "POST",
      credentials: crossApp ? "omit" : "same-origin",
      mode: crossApp ? "cors" : "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error || "request");
        return j;
      });
    });
  }

  function addGift() {
    if (!giftVariantId) return Promise.resolve();
    return postJson("/cart/add.js", {
      items: [{ id: giftVariantId, quantity: 1 }],
    });
  }

  function removeGift(lineKey) {
    return postJson("/cart/change.js", {
      id: lineKey,
      quantity: 0,
    });
  }

  function syncGift(cart, shouldAdd) {
    if (!giftVariantId) return Promise.resolve();
    var line = findGiftLine(cart);
    if (shouldAdd && !line) {
      return addGift().then(function () {
        return fetchCart();
      });
    }
    if (!shouldAdd && line && line.key) {
      return removeGift(line.key).then(function () {
        return fetchCart();
      });
    }
    return Promise.resolve(cart);
  }

  function run() {
    if (inFlight) return;
    inFlight = true;
    fetchCart()
      .then(function (cart) {
        var total = parseCartTotalDollars(cart);
        return postJson(appUrl + "/api/cart-check", {
          shop_domain: shop,
          cart_total: total,
        }).then(function (res) {
          return { cart: cart, res: res };
        });
      })
      .then(function (x) {
        var res = x.res;
        var cart = x.cart;
        if (res.message && (res.progress !== undefined || res.remaining !== undefined)) {
          setBar(typeof res.progress === "number" ? res.progress : 0, res.message);
        } else {
          hideBar();
        }
        var should = !!res.should_add_gift;
        return syncGift(cart, should).then(function (updated) {
          return { before: cart, after: updated };
        });
      })
      .then(function (ctx) {
        if (ctx.after && ctx.after !== ctx.before) {
          var total = parseCartTotalDollars(ctx.after);
          return postJson(appUrl + "/api/cart-check", {
            shop_domain: shop,
            cart_total: total,
          }).then(function (res) {
            if (res.message) {
              setBar(typeof res.progress === "number" ? res.progress : 0, res.message);
            }
          });
        }
      })
      .catch(function () {
        hideBar();
      })
      .finally(function () {
        inFlight = false;
      });
  }

  function runSafe() {
    schedule(run);
  }

  document.addEventListener("DOMContentLoaded", runSafe);

  document.addEventListener(
    "submit",
    function (e) {
      var t = e.target;
      if (t && t.action && String(t.action).indexOf("/cart") !== -1) {
        setTimeout(runSafe, 600);
      }
    },
    true
  );

  var origFetch = window.fetch;
  window.fetch = function () {
    var p = origFetch.apply(this, arguments);
    try {
      var url = arguments[0];
      if (
        typeof url === "string" &&
        (/\/cart\.js(\?|$)/.test(url) || /\/cart\/(add|change|update|clear)\.js/.test(url))
      ) {
        p.then(function (r) {
          if (r && r.ok) setTimeout(runSafe, 400);
          return r;
        });
      }
    } catch (e) {}
    return p;
  };

  setInterval(runSafe, 25000);
})();
