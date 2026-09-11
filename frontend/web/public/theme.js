(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    let saved;
    try { saved = localStorage.getItem('udaan-theme'); } catch { /* Use system preference. */ }
    document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
      ? saved : media.matches ? 'dark' : 'light';
    window.dispatchEvent(new Event('udaan-theme-change'));
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', apply);
})();
