/**
 * Cookie banner and consent management.
 * Manages user consent for analytics and third-party scripts.
 * Also injects SEO-safe Organization schema (JSON-LD).
 */
(function () {

  /* ===============================
     SEO: Organization Schema (JSON-LD)
     =============================== */
  function injectOrganizationSchema() {
    // Prevent duplicates
    if (document.getElementById("aorbo-org-schema")) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Aorbo Treks",
      "url": "https://aorbotreks.com",
      "logo": "https://aorbotreks.com/static/images/R-logo.webp",
      "sameAs": [
        "https://www.instagram.com/aorbo_treks_official",
        "https://www.linkedin.com/company/aorbo-treks"
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "aorbo-org-schema";
    script.textContent = JSON.stringify(schema);

    // Google prefers schema in <head>
    document.head.appendChild(script);
  }

  /* ===============================
     Cookie Helpers
     =============================== */
  function setCookie(name, value, days) {
    let expires = "";
    if (typeof days === "number") {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      expires +
      "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    const match = document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  }

  function deleteCookie(name) {
    document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
  }

  /* ===============================
     Analytics Control
     =============================== */
  function enableThirdParty() {
    if (window.__aorbo_analytics_loaded) return;

    const gaId = "G-XXXXXXXXXX"; // 🔴 replace with real GA ID

    if (gaId && gaId.startsWith("G-")) {
      const s = document.createElement("script");
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + gaId;
      s.async = true;
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;

      gtag("js", new Date());
      gtag("config", gaId);
    }

    window.__aorbo_analytics_loaded = true;
  }

  function disableThirdParty() {
    deleteCookie("_ga");
    deleteCookie("_gid");
    deleteCookie("_gat");
    window.__aorbo_analytics_loaded = false;
  }

  /* ===============================
     DOM Ready
     =============================== */
  document.addEventListener("DOMContentLoaded", function () {

    // ✅ Inject schema immediately (NO consent required)
    injectOrganizationSchema();

    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("accept-cookies");
    const declineBtn = document.getElementById("decline-cookies");

    if (!banner) return;

    const consent = getCookie("cookiesAccepted");

    if (consent === null) {
      banner.classList.remove("d-none");
    } else if (consent === "true") {
      enableThirdParty();
    } else {
      disableThirdParty();
    }

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        setCookie("cookiesAccepted", "true", 365);
        banner.classList.add("d-none");
        enableThirdParty();
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener("click", function () {
        setCookie("cookiesAccepted", "false", 365);
        banner.classList.add("d-none");
        disableThirdParty();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        banner.classList.add("d-none");
      }
    });
  });

})();
