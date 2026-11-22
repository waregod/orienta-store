/* Données fixes + état par défaut (tiré de l'emploi du temps papier) */

const DAYS = [
  { id: 0, label: 'Lundi',    short: 'Lun' },
  { id: 1, label: 'Mardi',    short: 'Mar' },
  { id: 2, label: 'Mercredi', short: 'Mer' },
  { id: 3, label: 'Jeudi',    short: 'Jeu' },
  { id: 4, label: 'Vendredi', short: 'Ven' },
  { id: 5, label: 'Samedi',   short: 'Sam' },
];

/* Lignes de la grille. `long` = grande ligne (matin / après-midi),
   après 17 h : une ligne toutes les 2 h. Modifiable ici. */
const SLOTS = [
  { id: 'm',  start: '08:00', end: '12:00', long: true },
  { id: 'p',  start: '12:00', end: '13:00', pause: true },
  { id: 'a',  start: '13:00', end: '17:00', long: true },
  { id: 's1', start: '17:00', end: '19:00' },
  { id: 's2', start: '19:00', end: '21:00' },
  { id: 's3', start: '21:00', end: '23:00' },
  { id: 's4', start: '23:00', end: '25:00' }, /* 23 h – 1 h */
  { id: 's5', start: '25:00', end: '27:00' }, /* 1 h – 3 h */
];

/* Teintes (degrés HSL) proposées pour les matières */
const HUES = [215, 28, 152, 340, 45, 270, 190, 95];

/* Types proposés dans le formulaire d'une matière / activité */
const KINDS = ['Cours', 'Activité', 'RDV love', 'Formation', 'TD'];

const DEFAULT_WEEK = { start: '2026-11-16', end: '2026-11-21' };

const DEFAULT_STATE = {
  v: 2,
  seed: 3,
  meta: { title: 'L1 SCD / DSIA A', room: 'Salle D9' },
  subjects: [
    { id: 'analyse', name: 'Analyse', teacher: 'Dr Kraidi', phone: '0708196926', room: '', kind: 'Cours', hue: 215 },
    { id: 'archi', name: 'Architecture et système d’exploitation', teacher: 'Dr Gouho', phone: '0504160484', room: '', kind: 'Cours', hue: 28 },
  ],
  /* une grille par semaine, clé = date de début (AAAA-MM-JJ).
     Dans une grille : "jour-créneau" → id de matière */
  weeks: {
    '2026-11-16': { start: '2026-11-16', end: '2026-11-21', grid: { '1-m': 'analyse', '2-a': 'archi' } },
  },
  current: '2026-11-16',
  /* semaines enregistrées (copies figées, voir bouton Enregistrer) */
  saved: [],
};
