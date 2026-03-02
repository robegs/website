from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS_PATH = ROOT / 'games' / 'packet-defender.js'
OUT_PATH = ROOT / 'tower-defense-mobile.html'

js = JS_PATH.read_text(encoding='utf-8')

css = """
:root {
  --ink: #0c1329;
  --muted: #475569;
  --edge: #dbe3ed;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Segoe UI", "Space Grotesk", Arial, sans-serif;
  color: var(--ink);
  background: linear-gradient(180deg, #f7f4ef 0%, #f2efe8 100%);
  touch-action: manipulation;
}
.page {
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
}
h1 { margin: 0 0 6px; font-size: 1.15rem; }
p { margin: 0 0 8px; color: var(--muted); font-size: .9rem; }
.lab-game { background: #fff; border: 1px solid var(--edge); border-radius: 12px; padding: 10px; }
.hud { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-bottom: 8px; }
.hud-item { border: 1px solid rgba(148,163,184,.45); border-radius: 8px; padding: 6px 8px; min-width: 0; background: #f8fafc; font-size: .82rem; }
.hud-item strong { display: block; font-size: .72rem; color: #475569; }
.action-row { display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; margin-bottom: 8px; padding-bottom: 2px; }
.action-row::-webkit-scrollbar { height: 4px; }
.action-row::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.btn {
  border: 1px solid rgba(148,163,184,.55);
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font: inherit;
  font-size: .85rem;
  background: #fff;
  white-space: nowrap;
}
.btn.primary { background: linear-gradient(135deg, #d97706, #ea580c); color: #fff; border-color: transparent; }
.btn.ghost { background: #f8fafc; }
.status { margin: 6px 0 8px; color: #64748b; min-height: 20px; font-size: .83rem; }
.choice-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; margin-bottom: 8px; }
.choice { border: 2px solid var(--edge); border-radius: 9px; padding: 7px; background: #fff; cursor: pointer; font: inherit; font-size: .82rem; }
.choice.active { border-color: #0ea5e9; background: #ecfeff; }
.bb-level-picker-label { font-size: .72rem; color: #64748b; align-self: center; white-space: nowrap; }
.bb-level-picker { border: 1px solid rgba(148,163,184,.55); border-radius: 999px; padding: 7px 10px; background: #fff; font: inherit; font-size: .82rem; }
.bb-canvas-wrap {
  width: 100%;
  border: 1px solid rgba(148,163,184,.45);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #0b132b;
}
.bb-canvas {
  width: 100%;
  height: auto;
  display: block;
  touch-action: none;
}
.footer-note { margin-top: 8px; font-size: .78rem; color: #64748b; }
@media (min-width: 700px) {
  .page { max-width: 900px; padding: 14px; }
  .hud { grid-template-columns: repeat(5, minmax(0,1fr)); }
  .choice-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
}
"""

html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />
  <title>Tower Defense Mobile</title>
  <style>{css}</style>
</head>
<body>
  <div class=\"page\">
    <h1>Path Guardians TD - Mobile Standalone</h1>
    <p>Optimized for phones. Works offline by opening this file directly.</p>
    <p>Tip: landscape orientation gives a better gameplay area.</p>
    <div id=\"app\"></div>
    <p class=\"footer-note\">Single-file mobile build from <code>games/packet-defender.js</code>.</p>
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
