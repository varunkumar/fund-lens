import { createStore } from './core/store.js';

const ALARM = 'fund-lens-purge';
const store = createStore();
const purge = () => store.purgeExpired().catch(() => {});

function ensureAlarm() {
  chrome.alarms.create(ALARM, { periodInMinutes: 5 });
}

chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  purge();
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) purge();
});

// The service worker can start without onInstalled/onStartup firing.
Promise.resolve(chrome.alarms.get(ALARM))
  .then((a) => { if (!a) ensureAlarm(); })
  .catch(() => {});
purge();
