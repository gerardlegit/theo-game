// ============================================================================
// Gestion des scènes (titre, étape, transition, fiche…) : une seule scène
// active à la fois, qui reçoit les pas logiques et le dessin.
// ============================================================================

export function createSceneManager() {
  let current = null;
  return {
    get current() { return current; },
    set(scene, params) {
      if (current && current.exit) current.exit();
      current = scene;
      if (scene.enter) scene.enter(params);
    },
    update(dt) { if (current && current.update) current.update(dt); },
    render(ctx, alpha, frameDt) { if (current && current.render) current.render(ctx, alpha, frameDt); },
    resize(view) { if (current && current.resize) current.resize(view); },
  };
}
