# Privacy Policy: Signed or Passed

_Last updated: 2026-10-14_

Signed or Passed is a YouTube channel that publishes animated stories about business decisions. This repository
contains the software ("the factory") that renders the videos and, when an operator starts it manually, uploads them
to the channel's own YouTube account through the YouTube Data API.

## What data we access
- The factory uses the YouTube Data API only to upload videos, captions and thumbnails to **our own channel**.
- It does not read, collect, store or share data about YouTube viewers or other users.
- OAuth credentials (client id, client secret, refresh token) are stored as encrypted GitHub Actions secrets and are
  used only to authorise uploads to our own channel. They are never written to files or logs.

## Cookies and tracking
The factory sets no cookies and runs no tracking.

## Third parties
Videos are hosted by YouTube; YouTube's own privacy policy applies to viewers: https://policies.google.com/privacy.
Use of the YouTube API is subject to the YouTube Terms of Service: https://www.youtube.com/t/terms.

## Revoking access
The channel owner can revoke the factory's access at any time at https://myaccount.google.com/permissions.

## Contact
Questions: open an issue in this repository or contact the channel owner via the channel's About page.
