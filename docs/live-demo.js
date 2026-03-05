const counters = document.querySelectorAll("[data-counter]");

counters.forEach((counter) => {
  const target = Number(counter.getAttribute("data-counter")) || 0;
  const durationMs = 900;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / durationMs, 1);
    counter.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
});
