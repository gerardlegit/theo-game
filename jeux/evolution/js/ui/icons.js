// ============================================================================
// Petites icônes en SVG pour l'interface (jauge, cœurs, fiches) : toutes les
// infos importantes sont aussi données par une image.
// ============================================================================

const svg = (body, view = '0 0 24 24') => `<svg viewBox="${view}" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  heart: svg('<path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" fill="#FF6F91" stroke="#FFFFFF" stroke-width="1.8"/>'),
  molecule: svg('<g fill="#F5E27A" stroke="#5BE37D" stroke-width="1.6"><circle cx="12" cy="10" r="5"/><circle cx="6" cy="16" r="3.4"/><circle cx="18" cy="16" r="3.4"/></g>'),
  bacterium: svg('<path d="M2 12c1.5-2 2.5 2 4 0" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/><rect x="6" y="7" width="16" height="10" rx="5" fill="#F7A6C1" stroke="#5BE37D" stroke-width="1.8"/>'),
  membrane: svg('<circle cx="12" cy="12" r="8.5" fill="#8FE3B0" stroke="#FFFFFF" stroke-width="3"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#2C8C78" stroke-width="1.2" stroke-dasharray="2 2"/>'),
  nucleus: svg('<circle cx="12" cy="12" r="9" fill="#9AD8F5" stroke="#FFFFFF" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="#5B8FD9"/><circle cx="12" cy="12" r="1.6" fill="#1F2A44" opacity=".5"/>'),
};
