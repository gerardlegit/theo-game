// ============================================================================
// GUIDE « PARENTS ET ENSEIGNANTS » — ouvre et ferme le panneau du guide sur
// les jeux plein écran (section #guide.is-overlay, voir shared/guide.css).
//
// Un bouton [data-guide-open] de l'écran d'accueil ouvre le panneau ; la
// croix, un clic à côté ou la touche Échap le referment. Tant qu'il est
// ouvert, les touches, clics et glissés ne remontent pas jusqu'au jeu.
// ============================================================================

const guide = document.getElementById('guide');

if (guide && guide.classList.contains('is-overlay')) {
  const closeBtn = guide.querySelector('[data-guide-close]');
  let opener = null;

  const open = (btn) => {
    opener = btn;
    guide.hidden = false;
    guide.scrollTop = 0;
    closeBtn?.focus();
  };
  const close = () => {
    guide.hidden = true;
    opener?.focus();
  };

  document.querySelectorAll('[data-guide-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      open(btn);
    });
    // Le jeu ne doit pas prendre ce clic pour un clic de partie
    for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
      btn.addEventListener(type, (e) => e.stopPropagation());
    }
  });

  guide.addEventListener('click', (e) => {
    if (e.target === guide || e.target.closest('[data-guide-close]')) close();
  });
  guide.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Rien de ce qui se passe dans le panneau ne doit piloter le jeu
  for (const type of ['keydown', 'keyup', 'click', 'dblclick', 'contextmenu', 'wheel',
    'pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup',
    'touchstart', 'touchmove', 'touchend']) {
    guide.addEventListener(type, (e) => e.stopPropagation());
  }
}
