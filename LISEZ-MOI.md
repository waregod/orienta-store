# Orienta Store — votre boutique d'applications

Site 100 % statique (aucun serveur, aucune base de données). Il affiche vos applications,
détecte l'appareil du visiteur (Android / Windows / iPhone) et propose le bon fichier.

## 1. Ajouter vos fichiers
Déposez dans `downloads/`, avec ces noms exacts :
- `emploi-du-temps.apk`, `emploi-du-temps-setup.exe`, `emploi-du-temps-portable.exe`, `cards.apk`
(les APK sont les `app-debug.apk` récupérés sur GitHub, renommés.)

## 2. Mettre en ligne (gratuit)
Le site doit être en HTTPS. Choix le plus simple, avec votre domaine :
- **Netlify Drop** (app.netlify.com/drop) : glissez le dossier `orienta-store`, puis ajoutez un
  sous-domaine, par ex. `store.card-revision.site` (Domain management), ou
- **GitHub Pages** : nouveau dépôt, envoyez le contenu, Settings > Pages.
Limite GitHub : 100 Mo par fichier (le .exe Windows fait environ 75 Mo : c'est juste mais ça passe).

## iPhone
Pas de fichier à télécharger sur iPhone : le dossier `emploi-du-temps/` est la version web installable (PWA).
Mettez-le en ligne avec le reste (il doit rester dans ce dossier). Le visiteur iPhone l'ouvre dans Safari,
puis Partager > « Sur l'écran d'accueil ». Si vous modifiez l'appli, changez `CACHE` dans `emploi-du-temps/sw.js`
(edt-mobile-v2, v3…) pour que les téléphones reçoivent la nouvelle version.

## 3. Modifier le catalogue
Tout est dans `js/apps.js` : ajouter une application (copiez un bloc), changer la version ou la date,
renseigner la taille d'un fichier (`size: '4,2 Mo'`), ajouter votre numéro WhatsApp (`STORE.whatsapp`)
pour afficher « Écrivez-nous sur WhatsApp ».
Icônes dans `icons/`, captures dans `shots/`.

## Publier une nouvelle version
1. Remplacez le fichier dans `downloads/` (même nom).
2. Changez `version` et `updated` dans `js/apps.js`.
3. Remettez le dossier en ligne.
