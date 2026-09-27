export const SOURCES = ['kfintech', 'cams'];
export const SOURCE_LABELS = { kfintech: 'KFintech', cams: 'myCAMS' };

const HOSTS = {
  'mfs.kfintech.com': 'kfintech',
  'newmycams.camsonline.com': 'cams',
};

export function sourceForHost(host) {
  return HOSTS[host] ?? null;
}
