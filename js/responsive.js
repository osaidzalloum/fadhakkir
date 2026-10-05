// ضبط مقياس إطار التطبيق ليلائم الشاشة — التخطيط الداخلي يبقى 402×874 كما صُمّم
(function () {
  var W = 402, H = 874;
  function fit() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H, 1);
    document.documentElement.style.setProperty("--fd-scale", String(s));
  }
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", function () { setTimeout(fit, 120); });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  fit();
  document.addEventListener("DOMContentLoaded", fit);
})();
