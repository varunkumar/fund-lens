import { createStore } from './core/store.js';

const ALARM = 'fund-lens-purge';
const store = createStore();

function ensureAlarm() {
  chrome.alarms.create(ALARM, { periodInMinutes: 5 });
}

chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) store.purgeExpired();
});
