/* ============================================================
   CATALOGUE — c'est le seul fichier à modifier pour ajouter
   une application ou publier une nouvelle version.
   ============================================================ */

const STORE = {
  name: 'Orienta Store',
  owner: 'Orienta Plus Corp',
  city: 'Abidjan',
  /* Numéro WhatsApp pour l'aide, au format international sans + ni espaces
     (ex. '2250700000000'). Laissez vide pour masquer le bouton. */
  whatsapp: '',
};

/* Étapes d'installation, affichées sur l'accueil et sur chaque page d'application */
const INSTALL = {
  android: [
    'Touchez « Télécharger pour Android ». Le fichier se termine par .apk.',
    'Quand le téléchargement est fini, touchez le fichier dans la notification ou dans le dossier Téléchargements.',
    'Si Android indique que l’installation est bloquée, touchez Paramètres et autorisez votre navigateur à installer des applications.',
    'Si Play Protect affiche un avertissement, touchez « Plus de détails », puis « Installer quand même ».',
    'Touchez Installer, puis Ouvrir.',
  ],
  windows: [
    'Téléchargez le fichier d’installation (.exe).',
    'Double-cliquez dessus. Si Windows affiche « SmartScreen a protégé votre PC », cliquez sur « Informations complémentaires », puis sur « Exécuter quand même ».',
    'Suivez l’assistant, puis ouvrez l’application depuis le menu Démarrer.',
  ],
};

INSTALL.ios = [
  'Ouvrez cette page dans Safari (pas dans Chrome ni dans une autre application).',
  'Touchez « Ouvrir la version web », puis le bouton Partager (le carré avec une flèche vers le haut).',
  'Faites défiler et touchez « Sur l’écran d’accueil », puis Ajouter.',
  'Ouvrez l’application depuis son icône sur l’écran d’accueil. Après la première ouverture, elle marche sans Internet.',
];

const DOWNLOAD_RELEASE = 'v1.0.0';
const RELEASE_BASE = `https://github.com/waregod/orienta-store/releases/download/${DOWNLOAD_RELEASE}`;

const APPS = [
  {
    id: 'emploi-du-temps',
    name: 'Emploi du temps',
    tagline: 'Votre semaine de cours, matière par matière.',
    description:
      'Glissez vos matières dans la grille de la semaine, ajoutez l’enseignant, la salle et le téléphone, et gardez chaque semaine enregistrée. L’application indique le prochain cours et marche sans Internet.',
    features: [
      'Matières et activités à glisser dans la grille, du lundi au samedi',
      'Semaines enregistrées, avec export en fichier .txt',
      'Sauvegarde et restauration complètes en un fichier .json',
      'Impression de l’emploi du temps',
    ],
    color: '#0F7B55',
    ink: '#FFFFFF',
    icon: 'icons/emploi-du-temps.png',
    version: '1.0.0',
    updated: '2026-11-22',
    access: null,
    updateNote:
      'Sur iPhone : la version web se met à jour toute seule. Avant une mise à jour sur Android : dans l’application, faites Réglages > Exporter, désinstallez l’ancienne version, installez la nouvelle, puis Réglages > Importer.',
    shots: [
      { src: 'shots/emploi-mobile.webp', alt: 'Emploi du temps sur téléphone : liste des matières et grille de la semaine', kind: 'mobile' },
      { src: 'shots/emploi-bureau.webp', alt: 'Emploi du temps sur ordinateur : grille de la semaine et liste des matières', kind: 'bureau' },
    ],
    /* size : taille du fichier, par ex. '4,2 Mo'. Laissez vide pour ne rien afficher. */
    downloads: [
      { platform: 'android', label: 'Android (APK)', file: `${RELEASE_BASE}/emploi-du-temps.apk`, size: '' },
      { platform: 'windows', label: 'Windows, installateur', file: `${RELEASE_BASE}/emploi-du-temps-setup.exe`, size: '' },
      /* pwa: true = installable sur l'écran d'accueil (iPhone). Dossier : emploi-du-temps/ */
      { platform: 'web', label: 'Version web (iPhone, Android, ordinateur)', href: 'emploi-du-temps/', pwa: true },
    ],
  },
  {
    id: 'cards',
    name: 'Cards',
    tagline: 'Vos collections de cartes de révision.',
    description:
      'Cards se connecte au site card-revision.site : vous y retrouvez vos collections toujours à jour. L’accès est réservé aux personnes invitées. Pour activer votre compte, il faut l’adresse e-mail enregistrée et un code d’accès à usage unique.',
    features: [
      'Connexion avec votre compte, comme sur le site',
      'Toujours à jour : le contenu vient directement du site',
      'Internet nécessaire',
    ],
    color: '#0B1020',
    ink: '#FFFFFF',
    icon: 'icons/cards.png',
    version: '1.0.0',
    updated: '2026-11-22',
    access: 'Accès sur invitation, code d’accès requis',
    updateNote: 'Les nouvelles versions s’installent par-dessus l’ancienne, sans perte de données.',
    shots: [],
    downloads: [
      { platform: 'android', label: 'Android (APK)', file: `${RELEASE_BASE}/cards.apk`, size: '' },
      { platform: 'web', label: 'Version web (iPhone, Android, ordinateur)', href: 'https://card-revision.site', pwa: true },
    ],
  },
];
