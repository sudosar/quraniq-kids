#!/bin/bash
# install.sh — install/refresh the QuranIQ Kids bug-reporter service.
# Idempotent. Run as root on the VM. Expects the server/ payload in
# /tmp/bug-reporter-pkg (scp'd there by the ops workflow).
set -uo pipefail

SRC=/tmp/bug-reporter-pkg
LIB=/usr/local/lib/bug-reporter
DATA=/var/lib/bug-reporter
ENV_FILE=/etc/bug-reporter.env
UNIT=/etc/systemd/system/bug-reporter.service
OVERALL=DONE

echo "== payload =="
ls -la "$SRC" || { echo "FATAL: payload missing at $SRC"; exit 2; }

echo "== port check =="
if ss -tlnp 2>/dev/null | grep -q "127.0.0.1:8791"; then
  if systemctl is-active --quiet bug-reporter; then
    echo "8791 already held by bug-reporter (reinstall)"
  else
    echo "FATAL: 127.0.0.1:8791 is bound by another process"
    ss -tlnp | grep 8791
    exit 5
  fi
fi

echo "== service user =="
if id www-data >/dev/null 2>&1; then
  RUNUSER=www-data
else
  id bugreporter >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin bugreporter
  RUNUSER=bugreporter
fi
echo "RUNUSER=$RUNUSER"

echo "== install files =="
mkdir -p "$LIB" "$DATA/shots"
install -m 644 "$SRC/bug_reporter.py" "$LIB/bug_reporter.py"
install -m 644 "$SRC/caddy_patch.py" "$LIB/caddy_patch.py"
sed "s/^User=.*/User=$RUNUSER/" "$SRC/bug-reporter.service" > "$UNIT"
chmod 644 "$UNIT"
chown -R "$RUNUSER" "$DATA"

echo "== env file =="
if [ -n "${BUG_REPORTER_TOKEN:-}" ]; then
  printf 'GITHUB_TOKEN=%s\n' "$BUG_REPORTER_TOKEN" > "$ENV_FILE"
  echo "token installed from workflow secret (value not shown)"
elif [ ! -f "$ENV_FILE" ]; then
  printf 'GITHUB_TOKEN=\n' > "$ENV_FILE"
  echo "created placeholder $ENV_FILE (token not set yet)"
else
  echo "$ENV_FILE already exists — left untouched"
fi
chmod 600 "$ENV_FILE"

echo "== systemd =="
systemctl daemon-reload
systemctl enable bug-reporter >/dev/null 2>&1
systemctl restart bug-reporter
for i in $(seq 1 10); do
  sleep 1
  if curl -s --max-time 3 http://127.0.0.1:8791/api/bug-health >/dev/null 2>&1; then break; fi
done
systemctl is-active bug-reporter && curl -s --max-time 3 http://127.0.0.1:8791/api/bug-health; echo

echo "== caddy =="
CADDYFILE=""
EXEC_LINE=$(systemctl cat caddy 2>/dev/null | grep -m1 ExecStart || true)
if [ -n "$EXEC_LINE" ]; then
  CADDYFILE=$(echo "$EXEC_LINE" | grep -oE '/[^ ]*Caddyfile' | head -1 || true)
fi
[ -z "${CADDYFILE:-}" ] && [ -f /etc/caddy/Caddyfile ] && CADDYFILE=/etc/caddy/Caddyfile
if [ -z "${CADDYFILE:-}" ] || [ ! -f "$CADDYFILE" ]; then
  echo "CADDY_SKIP: could not locate a Caddyfile; service installed but not routed"
  systemctl cat caddy 2>/dev/null | head -20
  OVERALL=PARTIAL
else
  echo "CADDYFILE=$CADDYFILE"
  cp "$CADDYFILE" "$CADDYFILE.bak-$(date +%Y%m%d%H%M%S)"
  python3 "$LIB/caddy_patch.py" "$CADDYFILE"
  PATCH_RC=$?
  if [ "$PATCH_RC" = "3" ]; then
    echo "CADDY_NOMATCH: config left unchanged; full config follows for review"
    cat "$CADDYFILE"
    OVERALL=PARTIAL
  else
    if caddy validate --config "$CADDYFILE" >/dev/null 2>&1; then
      systemctl reload caddy 2>/dev/null || systemctl restart caddy
      echo "caddy reloaded, config valid"
    else
      echo "CADDY_INVALID: restoring backup"
      cp "$CADDYFILE".bak-* "$CADDYFILE" 2>/dev/null || true
      ls -t "$CADDYFILE".bak-* | head -1 | xargs -I{} cp {} "$CADDYFILE"
      systemctl reload caddy 2>/dev/null || true
      OVERALL=PARTIAL
    fi
  fi
fi

echo "== public verify =="
sleep 2
echo -n "site: "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 15 https://kids.sabaq.net/
echo -n "health: "; curl -s --max-time 15 https://kids.sabaq.net/api/bug-health | head -c 300; echo
echo -n "probe POST: "
curl -s --max-time 15 -X POST https://kids.sabaq.net/api/bug-report \
  -H 'Content-Type: application/json' \
  -d '{"description":"__install_probe__","url":"https://kids.sabaq.net/","screen":"0x0","userAgent":"installer"}' | head -c 300
echo
echo "OVERALL=$OVERALL"
