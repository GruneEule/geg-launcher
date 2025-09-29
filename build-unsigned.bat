@echo off
echo Starte Build ohne Signierung...
set TAURI_SIGNING_PRIVATE_KEY=
yarn tauri build
echo Build abgeschlossen!
pause