import { SUPPORTED_HOSTS } from './sources.js';

// Rules for chrome.declarativeContent: the toolbar action is enabled only on supported hosts.
export function supportedPageConditions(hosts = SUPPORTED_HOSTS) {
  return hosts.map((host) => ({ pageUrl: { hostEquals: host, schemes: ['https'] } }));
}
