#!/usr/bin/env bash
set -euo pipefail
CAPTURE_DIR="$RUNNER_TEMP/issue-2-capture"
mkdir -p "$CAPTURE_DIR/classes" "$CAPTURE_DIR/dex" "$CAPTURE_DIR/screenshots"
SDK="$ANDROID_HOME"; BT="$SDK/build-tools/35.0.0"; API="$SDK/platforms/android-35/android.jar"
sed 's/<application /<application android:debuggable="true" /' android/AndroidManifest.xml > "$CAPTURE_DIR/AndroidManifest.xml"
mapfile -t sources < <(find android/src/com/morongaming/forsakenrealm -name '*.java')
javac -encoding UTF-8 -source 8 -target 8 -cp "$API" -d "$CAPTURE_DIR/classes" "${sources[@]}"
mapfile -t classes < <(find "$CAPTURE_DIR/classes" -name '*.class')
"$BT/d8" --lib "$API" --min-api 23 --output "$CAPTURE_DIR/dex" "${classes[@]}"
"$BT/aapt" package -f -M "$CAPTURE_DIR/AndroidManifest.xml" -S android/res -A android/assets -I "$API" -F "$CAPTURE_DIR/unsigned.apk"
jar uf "$CAPTURE_DIR/unsigned.apk" -C "$CAPTURE_DIR/dex" classes.dex
"$BT/zipalign" -f 4 "$CAPTURE_DIR/unsigned.apk" "$CAPTURE_DIR/aligned.apk"
keytool -genkeypair -alias capture -keyalg RSA -keysize 2048 -validity 2 -dname 'CN=Forsaken Realm CI Capture' -storetype PKCS12 -keystore "$CAPTURE_DIR/capture.p12" -storepass capturepass -keypass capturepass -noprompt
"$BT/apksigner" sign --ks "$CAPTURE_DIR/capture.p12" --ks-key-alias capture --ks-pass pass:capturepass --out "$CAPTURE_DIR/capture.apk" "$CAPTURE_DIR/aligned.apk"
"$BT/apksigner" verify "$CAPTURE_DIR/capture.apk"
adb install -r "$CAPTURE_DIR/capture.apk"
adb shell wm size 1280x720
adb shell wm density 240
PKG='com.morongaming.forsakenrealm.app'; ACT='com.morongaming.forsakenrealm.MainActivity'
adb shell am start -n "$PKG/$ACT" >/dev/null
sleep 3
cat > "$CAPTURE_DIR/prefs.xml" <<'EOF'
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
  <string name="endpoint">http://10.0.2.2:8788</string>
  <string name="token">TESTER01</string>
</map>
EOF
adb shell am force-stop "$PKG"
PREF_NAME="$(adb shell run-as "$PKG" ls shared_prefs 2>/dev/null | tr -d '\r' | head -1 || true)"
PREF_NAME="${PREF_NAME:-com.morongaming.forsakenrealm.MainActivity.xml}"
adb shell run-as "$PKG" mkdir -p shared_prefs
adb shell "run-as $PKG sh -c 'cat > shared_prefs/$PREF_NAME'" < "$CAPTURE_DIR/prefs.xml"
adb shell run-as "$PKG" cat "shared_prefs/$PREF_NAME" | grep -q 'TESTER01'
for scene in map village trader wilderness house; do
  rm -f "$CAPTURE_DIR/world.sqlite.day2-compact.sqlite" "$CAPTURE_DIR/world.sqlite.day2-compact.sqlite-wal" "$CAPTURE_DIR/world.sqlite.day2-compact.sqlite-shm"
  export REALM_WORLD_DB="$CAPTURE_DIR/world.sqlite" REALM_WORLD_PROFILE=day4-housing
  node scripts/issue-2-seed.mjs "$scene"
  PORT=8788 REALM_BIND_HOST=0.0.0.0 REALM_TEST_TOKENS='{"TESTER01":"capture-player"}' node server/http.mjs > "$CAPTURE_DIR/server.log" 2>&1 &
  SERVER_PID=$!
  for attempt in {1..30}; do if curl -fsS http://127.0.0.1:8788/health >/dev/null; then break; fi; sleep 1; done
  adb shell am force-stop "$PKG"
  adb shell am start -n "$PKG/$ACT" >/dev/null
  sleep 4
  adb shell input tap 200 193
  sleep 7
  adb shell input tap 1046 647
  sleep 5
  if [ "$scene" = map ]; then adb shell input tap 61 233; sleep 3; fi
  adb exec-out screencap -p > "$CAPTURE_DIR/screenshots/$scene.png"
  kill "$SERVER_PID" || true
  wait "$SERVER_PID" || true
done
printf 'Captured real emulator screens in %s\n' "$CAPTURE_DIR/screenshots"
