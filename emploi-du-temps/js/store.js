/* Couche de stockage.
   Version bureau : les données sont dans un vrai fichier (edt-data.json, dossier
   de l'utilisateur) via le processus principal d'Electron. Si ce fichier n'existe
   pas encore, on reprend l'ancien contenu de localStorage (migration). */

const Store = {
  KEY: 'edt:v1',

  async load() {
    try {
      if (window.desktop) {
        const fromFile = await window.desktop.load();
        if (fromFile) return fromFile;
      }
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Lecture impossible', err);
      return null;
    }
  },

  async save(state) {
    try {
      if (window.desktop) return await window.desktop.save(state);
      localStorage.setItem(this.KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn('Sauvegarde impossible', err);
      return false;
    }
  },

  async clear() {
    try {
      if (window.desktop) await window.desktop.clear();
      localStorage.removeItem(this.KEY);
    } catch (err) { /* ignore */ }
  },
};
