#!/usr/bin/env python3
"""
bug-reporter — tiny intake service for QuranIQ Kids bug reports.

Listens on 127.0.0.1:8791 (Caddy reverse-proxies the public paths):
  POST /api/bug-report    JSON report -> files a GitHub issue
  GET  /api/bug-shot/<id>.png   serves a stored screenshot (capability URL)
  GET  /api/bug-health    {"ok": true, "configured": bool}

The GitHub token lives ONLY here on the VM, in the systemd
EnvironmentFile /etc/bug-reporter.env (fine-grained PAT: Issues
read/write on sudosar/quraniq-kids only). No credentials in the app.

Stdlib only — no pip installs on the box.
"""
import base64
import json
import os
import re
import secrets
import time
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8791
REPO = "sudosar/quraniq-kids"
SITE = "https://kids.sabaq.net"
DATA_DIR = Path(os.environ.get("BUG_DATA_DIR", "/var/lib/bug-reporter"))
SHOTS_DIR = DATA_DIR / "shots"
TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
MAX_BODY = 4_000_000          # bytes of JSON accepted
MAX_SHOT = 2_500_000          # decoded screenshot bytes
RATE_MAX = 10                 # reports per IP per window
RATE_WINDOW = 3600            # seconds

_hits: dict[str, list[float]] = {}


def rate_limited(ip: str) -> bool:
    now = time.time()
    lst = [t for t in _hits.get(ip, []) if now - t < RATE_WINDOW]
    if len(lst) >= RATE_MAX:
        _hits[ip] = lst
        return True
    lst.append(now)
    _hits[ip] = lst
    return False


def create_issue(report: dict, shot_id: str | None) -> tuple[int, str]:
    desc = (report.get("description") or "").strip() or "No description provided"
    body = "## Bug Report\n\n"
    body += f"**Description:** {desc}\n\n"
    body += f"**URL:** {report.get('url', '')}\n"
    body += f"**Screen:** {report.get('screen', '')}\n"
    body += f"**Time:** {report.get('time', '')}\n"
    body += f"**Device:** {report.get('userAgent', '')}\n\n"
    if shot_id:
        body += f"## Screenshot\n\n![screenshot]({SITE}/api/bug-shot/{shot_id}.png)\n"
    payload = json.dumps({
        "title": f"🐛 Bug: {desc[:80]}",
        "body": body,
        "labels": ["bug", "user-reported"],
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/issues",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "quraniq-kids-bug-reporter",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("number", 0), data.get("html_url", "")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # keep journald tidy
        print(f"{self.address_string()} {fmt % args}", flush=True)

    def _json(self, code: int, obj: dict):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == "/api/bug-health":
            self._json(200, {"ok": True, "configured": bool(TOKEN)})
            return
        m = re.fullmatch(r"/api/bug-shot/([A-Za-z0-9_-]{16,40})\.png", self.path)
        if m:
            f = SHOTS_DIR / (m.group(1) + ".png")
            if f.is_file():
                raw = f.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(raw)))
                self.send_header("Cache-Control", "public, max-age=31536000, immutable")
                self.end_headers()
                self.wfile.write(raw)
                return
        self._json(404, {"ok": False, "error": "not_found"})

    def do_POST(self):
        if self.path != "/api/bug-report":
            self._json(404, {"ok": False, "error": "not_found"})
            return
        if rate_limited(self.address_string()):
            self._json(429, {"ok": False, "error": "rate_limited"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self._json(413, {"ok": False, "error": "bad_size"})
            return
        try:
            report = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self._json(400, {"ok": False, "error": "bad_json"})
            return
        if not TOKEN:
            self._json(503, {"ok": False, "error": "reporter_not_configured"})
            return
        # Optional screenshot: validate + store, link from the issue.
        shot_id = None
        shot = report.get("screenshot")
        if isinstance(shot, str) and shot.startswith("data:image/png;base64,"):
            try:
                raw = base64.b64decode(shot.split(",", 1)[1], validate=True)
                if 0 < len(raw) <= MAX_SHOT:
                    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
                    shot_id = secrets.token_urlsafe(18)
                    (SHOTS_DIR / f"{shot_id}.png").write_bytes(raw)
            except Exception as exc:
                print(f"screenshot rejected: {exc}", flush=True)
                shot_id = None
        try:
            number, url = create_issue(report, shot_id)
            self._json(201, {"ok": True, "issue": number, "url": url})
        except urllib.error.HTTPError as exc:
            print(f"github error {exc.code}: {exc.read()[:300]!r}", flush=True)
            self._json(502, {"ok": False, "error": "github_failed"})
        except Exception as exc:
            print(f"github unreachable: {exc}", flush=True)
            self._json(502, {"ok": False, "error": "github_failed"})


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"bug-reporter on {HOST}:{PORT} configured={bool(TOKEN)}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
