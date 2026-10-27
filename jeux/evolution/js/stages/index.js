// ============================================================================
// Liste des étapes jouables. POUR AJOUTER UNE ÉTAPE : créer son fichier de
// config (sur le modèle de cell.js), l'importer ici, ajouter ses textes dans
// content/fr.js (stages, cards, transitions) et son dessin dans render/looks.js.
// ============================================================================

import { CELL } from './cell.js';
import { NUCLEUS } from './nucleus.js';

export const STAGES = {
  cell: CELL,
  nucleus: NUCLEUS,
};

export const FIRST_STAGE = 'cell';
