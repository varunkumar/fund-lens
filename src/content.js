(async () => {
  const { init } = await import(chrome.runtime.getURL('src/content-main.js'));
  init();
})();
