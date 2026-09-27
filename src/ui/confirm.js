// Two-step destructive action: the first click arms the button, a second click within `ms` confirms.
export function confirmClick(btn, action, ms = 3000) {
  const label = btn.textContent;
  let timer = null;
  const disarm = () => { clearTimeout(timer); timer = null; btn.textContent = label; };
  btn.addEventListener('click', () => {
    if (timer) { disarm(); action(); return; }
    btn.textContent = 'Click again to confirm';
    timer = setTimeout(disarm, ms);
  });
}
