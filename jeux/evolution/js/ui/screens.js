// ============================================================================
// Écrans en HTML (titre, intro d'étape, fiche, pause…) : affichage, focus
// sur le premier bouton, et navigation au clavier avec les flèches.
// ============================================================================

const stack = [];                  // écrans ouverts, le dernier est au-dessus

export function showScreen(id, focus = true) {
  const el = document.getElementById(id);
  el.hidden = false;
  const i = stack.indexOf(el);
  if (i >= 0) stack.splice(i, 1);
  stack.push(el);
  if (focus) {
    const first = el.querySelector('[data-autofocus]') || buttons(el)[0];
    if (first) first.focus({ preventScroll: true });
  }
}

export function hideScreen(id) {
  const el = document.getElementById(id);
  el.hidden = true;
  const i = stack.indexOf(el);
  if (i >= 0) stack.splice(i, 1);
}

function buttons(el) {
  return [...el.querySelectorAll('button, a[href]')].filter((b) => !b.hidden && b.offsetParent !== null);
}

/* Flèches haut / bas (ou gauche / droite) : passe d'un bouton à l'autre */
export function installMenuKeys() {
  window.addEventListener('keydown', (e) => {
    const top = stack[stack.length - 1];
    if (!top || top.hidden) return;
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.code];
    if (!dir) return;
    const list = buttons(top);
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    const next = list[(i + dir + list.length) % list.length] || list[0];
    next.focus({ preventScroll: true });
    e.preventDefault();
  });
}
