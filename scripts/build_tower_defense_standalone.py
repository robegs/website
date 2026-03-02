from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS_PATH = ROOT / 'games' / 'packet-defender.js'
OUT_PATH = ROOT / 'tower-defense-standalone.html'

js = JS_PATH.read_text(encoding='utf-8')

css = """
:root {
  --ink: #0c1329;
  --muted: #475569;
  --edge: #dbe3ed;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Segoe UI", "Space Grotesk", Arial, sans-serif;
  color: var(--ink);
  background: linear-gradient(180deg, #f7f4ef 0%, #f2efe8 100%);
}
.page {
  max-width: 1380px;
  margin: 0 auto;
  padding: 16px;
}
h1 { margin: 0 0 8px; font-size: 1.6rem; }
p { margin: 0 0 12px; color: var(--muted); }
.lab-game { background: #fff; border: 1px solid var(--edge); border-radius: 14px; padding: 14px; }
.hud { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.hud-item { border: 1px solid rgba(148,163,184,.45); border-radius: 10px; padding: 8px 10px; min-width: 96px; background: #f8fafc; }
.action-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.btn {
  border: 1px solid rgba(148,163,184,.55);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  font: inherit;
  background: #fff;
}
.btn.primary { background: linear-gradient(135deg, #d97706, #ea580c); color: #fff; border-color: transparent; }
.btn.ghost { background: #f8fafc; }
.status { margin: 6px 0 10px; color: #64748b; min-height: 22px; }
.choice-grid { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
.choice { border: 2px solid var(--edge); border-radius: 10px; padding: 8px; background: #fff; cursor: pointer; font: inherit; }
.choice.active { border-color: #0ea5e9; background: #ecfeff; }
.bb-level-picker-label { font-size: .82rem; color: #64748b; align-self: center; }
.bb-level-picker { border: 1px solid rgba(148,163,184,.55); border-radius: 999px; padding: 8px 11px; background: #fff; font: inherit; }
.bb-canvas-wrap {
  width: 100%;
  border: 1px solid rgba(148,163,184,.45);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: #0b132b;
}
.bb-canvas { width: 100%; height: auto; display: block; }
.footer-note { margin-top: 10px; font-size: .85rem; color: #64748b; }
"""

html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Tower Defense Standalone</title>
  <style>{css}</style>
</head>
<body>
  <div class=\"page\">
    <h1>Path Guardians TD - Standalone</h1>
    <p>Offline single-file build. Open this file directly (double-click) to play without a server.</p>
    <div id=\"app\"></div>
    <p class=\"footer-note\">Generated from <code>games/packet-defender.js</code>.</p>
  </div>
  <script>
{js}
  </script>
  <script>
    (function () {{
      var mount = document.getElementById('app');
      if (typeof setupPacketDefender === 'function' && mount) {{
        setupPacketDefender(mount);
      }}
    }})();
  </script>
</body>
</html>
"""

OUT_PATH.write_text(html, encoding='utf-8')
print(f"Written: {OUT_PATH}")
