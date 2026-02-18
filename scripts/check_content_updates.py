#!/usr/bin/env python3
import hashlib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCES_FILE = os.path.join(ROOT, "monitoring", "sources.json")
STATE_FILE = os.path.join(ROOT, "monitoring", "last_snapshot.json")
REPORT_FILE = os.path.join(ROOT, "monitoring", "latest_report.md")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)
        f.write("\n")


def fetch(url, timeout=30):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; website-monitor/1.0; +https://github.com/robegs/website)"
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8", errors="ignore")
    return body


def clean_html(html):
    html = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    html = re.sub(r"(?is)<[^>]+>", " ", html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def digest_text(text):
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_report(changes, checked_count):
    lines = []
    lines.append("# Content Update Monitor Report")
    lines.append("")
    lines.append(f"- Run timestamp (UTC): {now_iso()}")
    lines.append(f"- Sources checked: {checked_count}")
    lines.append("")
    if not changes:
        lines.append("No changes detected in monitored sources.")
        return "\n".join(lines) + "\n"

    lines.append("## Detected Changes")
    lines.append("")
    for ch in changes:
        lines.append(f"- **{ch['name']}**")
        lines.append(f"  - URL: {ch['url']}")
        lines.append(f"  - Previous hash: `{ch['old_hash']}`")
        lines.append(f"  - Current hash: `{ch['new_hash']}`")
    lines.append("")
    lines.append("Action: review source pages and update website content if needed.")
    return "\n".join(lines) + "\n"


def main():
    if not os.path.exists(SOURCES_FILE):
        print(f"Missing sources file: {SOURCES_FILE}", file=sys.stderr)
        return 2

    sources = load_json(SOURCES_FILE)
    previous = {}
    if os.path.exists(STATE_FILE):
        previous = load_json(STATE_FILE).get("sources", {})

    current = {}
    changes = []
    errors = []

    for src in sources:
        name = src["name"]
        url = src["url"]
        try:
            html = fetch(url)
            cleaned = clean_html(html)
            new_hash = digest_text(cleaned)
            old_hash = previous.get(name, {}).get("hash")
            current[name] = {"url": url, "hash": new_hash, "checked_at": now_iso()}
            if old_hash and old_hash != new_hash:
                changes.append(
                    {
                        "name": name,
                        "url": url,
                        "old_hash": old_hash,
                        "new_hash": new_hash,
                    }
                )
        except Exception as exc:
            errors.append({"name": name, "url": url, "error": str(exc)})
            old_item = previous.get(name)
            if old_item:
                current[name] = old_item

    snapshot = {
        "last_run": now_iso(),
        "sources": current,
        "errors": errors,
    }
    save_json(STATE_FILE, snapshot)

    report = build_report(changes, len(sources))
    os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    if errors:
        print("Completed with fetch errors:")
        for err in errors:
            print(f"- {err['name']}: {err['error']}")

    print(f"Checked {len(sources)} source(s).")
    print(f"Detected {len(changes)} change(s).")

    # Exit code 10 means "changes detected"
    return 10 if changes else 0


if __name__ == "__main__":
    raise SystemExit(main())
