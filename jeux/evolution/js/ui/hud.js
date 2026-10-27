// ============================================================================
// HUD en jeu (en HTML par-dessus le canvas) : cœurs « descendants » en haut à
// gauche, énergie dessous, jauge de croissance au centre, messages courts.
// Le DOM n'est touché que quand une valeur change.
// ============================================================================

import { ICONS } from './icons.js';
import { typo } from '../content/fr.js';

export function createHud() {
  const $ = (id) => document.getElementById(id);
  const root = $('hud');
  const hearts = $('hearts');
  const energy = $('energy');
  const energyFill = $('energyFill');
  const growth = $('growth');
  const growthFill = $('growthFill');
  const growthCount = $('growthCount');
  const growthIcon = $('growthIcon');
  const toast = $('toast');
  const last = { growth: -1, hearts: -1, energy: -1, tired: null };
  let toastTimer = 0;

  return {
    show(stage, world) {
      root.hidden = false;
      growthIcon.innerHTML = ICONS[stage.food] || '';
      energy.hidden = !stage.sprint;
      hearts.innerHTML = '';
      for (let i = 0; i < world.maxHearts; i++) {
        const h = document.createElement('span');
        h.className = 'heart';
        h.innerHTML = ICONS.heart;
        hearts.appendChild(h);
      }
      last.growth = last.hearts = last.energy = -1;
      last.tired = null;
      this.update(world);
    },

    hide() {
      root.hidden = true;
      toast.classList.remove('show');
    },

    update(world) {
      if (world.growth !== last.growth) {
        const bump = last.growth >= 0 && world.growth > last.growth;
        last.growth = world.growth;
        growthFill.style.width = `${(world.growth / world.goal) * 100}%`;
        growthCount.textContent = `${world.growth} / ${world.goal}`;
        growth.setAttribute('aria-label', `Croissance : ${world.growth} sur ${world.goal}`);
        if (bump) {
          growth.classList.remove('bump');
          void growth.offsetWidth;   // relance l'animation
          growth.classList.add('bump');
        }
      }
      if (world.hearts !== last.hearts) {
        last.hearts = world.hearts;
        [...hearts.children].forEach((h, i) => h.classList.toggle('lost', i >= world.hearts));
        hearts.setAttribute('aria-label', `${world.hearts} descendant${world.hearts > 1 ? 's' : ''}`);
      }
      const e = Math.round(world.player.energy * 40) / 40;
      if (e !== last.energy) {
        last.energy = e;
        energyFill.style.width = `${e * 100}%`;
      }
      if (world.player.tired !== last.tired) {
        last.tired = world.player.tired;
        energy.classList.toggle('tired', last.tired);
      }
    },

    toast(text, ms = 2800) {
      toast.textContent = typo(text);
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
    },
  };
}
