// Resolves once the DOM under `root` stops changing after a click.
// Call BEFORE triggering the change: observation starts synchronously.
export function waitSettle(root, { firstMs = 1500, quietMs = 500, timeoutMs = 8000 } = {}) {
  const MO = root.ownerDocument.defaultView.MutationObserver;
  return new Promise((resolve) => {
    let quiet;
    let first;
    let hard;
    const done = (result) => {
      obs.disconnect();
      clearTimeout(quiet);
      clearTimeout(first);
      clearTimeout(hard);
      resolve(result);
    };
    const obs = new MO(() => {
      clearTimeout(first);
      clearTimeout(quiet);
      quiet = setTimeout(() => done('settled'), quietMs);
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    first = setTimeout(() => done('settled'), firstMs); // nothing changed: already rendered
    hard = setTimeout(() => done('timeout'), timeoutMs);
  });
}
