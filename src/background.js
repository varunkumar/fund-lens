import { createStore } from './core/store.js';
import { supportedPageConditions } from './core/page-rules.js';

const ALARM = 'fund-lens-purge';
const store = createStore();
const purge = () => store.purgeExpired().catch(() => {});

// The toolbar icon is greyed out everywhere except the supported portfolio sites.
function ensureActionRules() {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: supportedPageConditions().map((c) => new chrome.declarativeContent.PageStateMatcher(c)),
      actions: [new chrome.declarativeContent.ShowAction()],
    }]);
  });
}

function ensureAlarm() {
  chrome.alarms.create(ALARM, { periodInMinutes: 5 });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  ensureActionRules();
});
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
