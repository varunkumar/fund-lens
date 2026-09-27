#!/bin/sh
# Regenerates docs/screenshots/*.png from dummy data. Needs Google Chrome on macOS and python3.
set -e
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
python3 tools/screenshots/serve.py 8765 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV' EXIT
sleep 1
B=http://localhost:8765/tools/screenshots
shot() { # name width height url [extra flags]
  out="docs/screenshots/$1.png"; w=$2; h=$3; url=$4; shift 4
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=15000 --run-all-compositor-stages-before-draw \
    --window-size="$w,$h" --screenshot="$out" "$@" "$url" >/dev/null 2>&1
  echo "wrote $out"
}
shot popup 512 560 "$B/harness.html?page=popup&theme=light"
shot popup-empty 512 300 "$B/harness.html?page=popup&data=empty&theme=light"
shot popup-dark 512 560 "$B/harness.html?page=popup&theme=dark"
shot dashboard 1280 800 "$B/harness.html?page=dashboard&theme=light"
shot dashboard-full 1280 1560 "$B/harness.html?page=dashboard&theme=light"
shot dashboard-dark 1280 800 "$B/harness.html?page=dashboard&theme=dark"
shot store-popup 1280 800 "$B/store-frame.html"
