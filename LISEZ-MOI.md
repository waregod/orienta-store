# Orienta Store — votre boutique d'applications

Site 100 % statique (aucun serveur, aucune base de données). Il affiche vos applications,
détecte l'appareil du visiteur (Android / Windows / iPhone) et propose le bon fichier.

## Fichiers à télécharger
Les APK et l'installateur Windows sont publiés comme pièces jointes d'une
[GitHub Release](https://github.com/waregod/orienta-store/releases). Les liens du catalogue
pointent vers cette Release afin de ne pas faire télécharger les gros fichiers depuis le dépôt.

## Mettre le site en ligne
Le site doit être en HTTPS. Options :
- **Netlify Drop** (app.netlify.com/drop) : glissez le dossier `orienta-store`, puis ajoutez un
  sous-domaine, par ex. `store.card-revision.site` (Domain management), ou
- **GitHub Pages** : Settings > Pages dans le dépôt.

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
1. Créez une GitHub Release avec un nouveau tag (par ex. `v1.0.1`) et joignez les fichiers avec
   ces noms : `emploi-du-temps.apk`, `emploi-du-temps-setup.exe` et `cards.apk`.
2. Dans `js/apps.js`, remplacez `DOWNLOAD_RELEASE` par le nouveau tag, puis mettez à jour `version`
   et `updated` pour les applications concernées.
3. Envoyez les changements du site sur GitHub.
