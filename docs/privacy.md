# FundLens Privacy Policy

Last updated: 27 September 2026

FundLens is a browser extension that shows your mutual fund holdings from myCAMS (`newmycams.camsonline.com`) and KFintech (`mfs.kfintech.com`) in one table and dashboard. This policy explains what it does with your data.

## Summary
FundLens does not collect, transmit, sell or share your data. Everything stays in your browser.

## What FundLens reads
When you click "Sync this site" on a myCAMS or KFintech page you are already logged in to, FundLens reads the portfolio information shown on that page: fund name, invested amount and current value.

## What FundLens does not do
- It never asks for, reads or stores your login credentials.
- It makes no network requests and has no server, backend, analytics or tracking.
- It loads no remote code.
- It does not read any site other than myCAMS and KFintech.
- It does not sell, share or transfer data to anyone.

## Storage and retention
- Synced data is stored only on your device in `chrome.storage.local`.
- Only the latest sync per site is kept. A new sync overwrites the previous one, and no history is kept.
- Stored data is deleted automatically 1 hour after it was synced.
- You can also remove the data at any time by uninstalling the extension or clearing its data.

## Copy to clipboard
The "Copy" button places the table on your clipboard when you click it. What you paste it into (for example Google Sheets) is your choice and is outside FundLens.

## Permissions
- `storage`: keeps your latest sync on your device.
- `alarms`: deletes the stored data after 1 hour.
- `declarativeContent`: enables the toolbar icon only on myCAMS and KFintech. It reads no page content.
- Access to `newmycams.camsonline.com` and `mfs.kfintech.com`: lets FundLens read the portfolio page you are viewing.

## Affiliation
FundLens is an independent tool. It is not affiliated with, endorsed by or sponsored by CAMS or KFintech.

## Changes
If this policy changes, the updated version will be published at this location with a new date.

## Contact
Questions: open an issue at https://github.com/varunkumar/fund-lens/issues or write to varunkumar.n@gmail.com.
