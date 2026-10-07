#!/bin/sh
# Construit le zip à déposer sur addons.mozilla.org (version publique) :
# identique à l'extension, sans la ligne update_url (refusée pour les extensions
# hébergées par Mozilla, qui se chargent elles-mêmes des mises à jour).
# Usage : scripts/build-amo.sh [fichier.zip] [version]   (ex. no-feed-amo.zip 1.0.1)
set -eu
cd "$(dirname "$0")/.."
OUT="${1:-no-feed-amo.zip}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac
TMP="$(mktemp -d)"
cp -r extension/. "$TMP/"
python3 - "$TMP/manifest.json" "${2:-}" <<'PY'
import json, sys
p = sys.argv[1]
m = json.load(open(p, encoding="utf-8"))
m["browser_specific_settings"]["gecko"].pop("update_url", None)
if len(sys.argv) > 2 and sys.argv[2]:
    m["version"] = sys.argv[2]
json.dump(m, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
PY
rm -f "$OUT"
(cd "$TMP" && zip -q -r "$OUT" manifest.json icon.svg reddit youtube instagram)
rm -rf "$TMP"
echo "Créé : $OUT ($(python3 -c "import json,zipfile,sys;print('version', json.loads(zipfile.ZipFile(sys.argv[1]).read('manifest.json'))['version'])" "$OUT"))"
