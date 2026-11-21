# PaKuSteps

Aplikacja PWA z rodziny PaKu: dzieli zadania na małe kroki i pokazuje jeden krok naraz. Działa w pełni offline.
Języki: EN (domyślny), PL, DE, ES, FR, ZH, UK, LV.

## Pliki (wszystkie w jednym folderze, bez podfolderów)
- `index.html` – układ i style
- `app.js` – logika aplikacji (na górze stałe: wersja, adres aplikacji, kontakt, link do kawy)
- `i18n.js` – wszystkie tłumaczenia i szablony zadań
- `sw.js` – service worker (pamięć offline). **Po każdej zmianie podbij tu `VERSION`**, żeby użytkownicy dostali aktualizację.
- `manifest.webmanifest`, `icon*.png`, `icon.svg`, `apple-touch-icon.png` – instalacja i ikony
- `qr.svg` – kod QR prowadzący do aplikacji

## Publikacja na GitHub Pages
1. Utwórz publiczne repozytorium `PaKuSteps` i wgraj wszystkie pliki.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Aplikacja będzie pod adresem `https://zondelekpp-wq.github.io/PaKuSteps/`.
