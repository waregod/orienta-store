# Kit « application installable » pour card-revision.site

Rend le site installable sur l'écran d'accueil (iPhone, Android, ordinateur).
Il ne change rien au site ni à la connexion. Le service worker ne garde aucune donnée privée.

## 1. Copier les fichiers à la RACINE du site
Le dossier qui est servi à l'adresse https://card-revision.site/ :
- site HTML simple : à côté de index.html
- Vite / React / Next.js : dans le dossier `public/`
Fichiers : `manifest.webmanifest`, `sw.js`, `offline.html`, `pwa-register.js` et le dossier `icons/`.
IMPORTANT : `sw.js` doit être à la racine (pas dans un sous-dossier), sinon il ne couvre pas tout le site.

## 2. Ajouter ces lignes dans le <head> de la page d'accueil (index.html)
```html
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Cards">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<script src="/pwa-register.js" defer></script>
```
(Avec Next.js : dans `app/layout.tsx` ou `pages/_document.tsx`.)

## 3. Vérifier
- https://card-revision.site/manifest.webmanifest et /sw.js doivent s'ouvrir (pas d'erreur 404).
- Chrome : F12 > Application > Manifest : aucune erreur ; Service Workers : « activated ».
- Si le site envoie une politique CSP, autorisez les scripts de même origine (`script-src 'self'`).

## Installer
- iPhone : Safari > Partager > « Sur l'écran d'accueil ».
- Android : Chrome > menu ⋮ > « Installer l'application ».
