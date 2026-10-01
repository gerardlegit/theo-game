// ============================================================================
// Les 10 énigmes du contrôleur.
//
// Chaque niveau tire au hasard un numéro (de 1 à 99, tous différents) pour
// chacun des 24 sièges du wagon, en cachant toujours une solution parmi eux
// ("plant" : 5 couples [gros, petit]). N'importe quelle solution qui respecte
// la règle est acceptée, pas seulement celle qui a été cachée.
//
//   pair : règle à respecter dans CHAQUE famille (g = siège du gros, e = du petit)
//   sum  : règle sur les totaux (gs = sièges des 5 gros, es = des 5 petits)
// ============================================================================

export const SEAT_COUNT = 24;

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const total = (list) => list.reduce((a, b) => a + b, 0);
const addition = (list) => `${list.join(' + ')} = ${total(list)}`;

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Complète les sièges avec des numéros au hasard, tous différents. */
function withFillers(numbers) {
  const used = new Set(numbers);
  const seats = [...numbers];
  while (seats.length < SEAT_COUNT) {
    const v = rand(1, 99);
    if (!used.has(v)) {
      used.add(v);
      seats.push(v);
    }
  }
  return shuffle(seats);
}

/** Tire n couples [gros, petit] avec gros = big(petit), tous les numéros différents. */
function makePairs(n, smallMin, smallMax, big, taken = new Set()) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const used = new Set(taken);
    const pairs = [];
    for (let k = 0; k < 300 && pairs.length < n; k++) {
      const e = rand(smallMin, smallMax);
      const g = big(e);
      if (g < 1 || g > 99 || g === e || used.has(e) || used.has(g)) continue;
      used.add(e);
      used.add(g);
      pairs.push([g, e]);
    }
    if (pairs.length === n) return pairs;
  }
  throw new Error('Impossible de générer le niveau');
}

/** 5 couples [gros, petit] dont les petits font `target` ensemble, + des couples pièges. */
function makePairsWithKidsTotal(big, smallMin, smallMax, target, decoyMax, decoys = 2) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const es = [];
    for (let i = 0; i < 4; i++) es.push(rand(smallMin, smallMax));
    es.push(target - total(es));
    if (es.some((e) => e < smallMin || e > smallMax)) continue;
    const all = es.flatMap((e) => [e, big(e)]);
    if (all.some((v) => v < 1 || v > 99) || new Set(all).size !== 10) continue;
    const plant = es.map((e) => [big(e), e]);
    try {
      const extra = makePairs(decoys, smallMin, decoyMax, big, new Set(all));
      return { seats: withFillers([...all, ...extra.flat()]), plant };
    } catch {
      continue;
    }
  }
  throw new Error('Impossible de générer le niveau');
}

/** Règle du type « le gros est sur <calcul avec le petit> ». */
const relation = (expr, value) => ({
  ok: (g, e) => g === value(e),
  calc: (g, e) => (g === value(e) ? `${expr(e)} = ${value(e)}` : `${expr(e)} = ${value(e)}, pas ${g}`),
  wrong: (g, e) => `${expr(e)} = ${value(e)}, mais le gros est sur ${g}.`,
});

const kidsTotal = (target) => ({
  ok: (gs, es) => total(es) === target,
  lines: (gs, es) => [`Petits : ${addition(es)}${total(es) === target ? '' : ` (il faut ${target})`}`],
  wrong: (gs, es) => `Les 5 petits font ${total(es)} ensemble, mais il faut ${target}.`,
});

const G = '<span class="g">gros</span>';
const P = '<span class="p">petit</span>';

export const LEVELS = [
  {
    title: "Les grands d'abord",
    rule: 'Chaque <b>gros doudou</b> doit s\'asseoir sur un numéro <b>plus grand</b> que celui de son petit.',
    formula: `${G} &gt; ${P}`,
    example: 'Exemple : petit sur 8 et gros sur 15 → 15 est plus grand que 8 ✓',
    pair: {
      ok: (g, e) => g > e,
      calc: (g, e) => (g > e ? `${g} est plus grand que ${e}` : `${g} est plus petit que ${e}`),
      wrong: (g, e) => `le gros est sur ${g} et le petit sur ${e} : ${g} est plus petit que ${e} !`,
    },
    generate() {
      const nums = shuffle(Array.from({ length: 99 }, (_, i) => i + 1)).slice(0, 10).sort((a, b) => a - b);
      const plant = [0, 1, 2, 3, 4].map((i) => [nums[i + 5], nums[i]]);
      return { seats: withFillers(nums), plant };
    },
  },
  {
    title: 'Le double',
    rule: 'Chaque gros doudou s\'assoit sur le <b>double</b> du numéro de son petit.',
    formula: `${G} = ${P} × 2`,
    example: 'Exemple : petit sur 7 → gros sur 14 (7 × 2 = 14)',
    pair: relation((e) => `${e} × 2`, (e) => e * 2),
    generate() {
      const plant = makePairs(5, 2, 49, (e) => e * 2);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'La balance',
    rule: 'Additionne les numéros : la <b>somme des 5 gros</b> doit être <b>égale</b> à la <b>somme des 5 petits</b>.',
    formula: `${G} + ${G} + … = ${P} + ${P} + …`,
    example: 'Exemple avec 2 familles : gros 10 + 5 = 15 et petits 9 + 6 = 15 ✓',
    sum: {
      ok: (gs, es) => total(gs) === total(es),
      lines: (gs, es) => [`Gros : ${addition(gs)}`, `Petits : ${addition(es)}`],
      wrong: (gs, es) => `Les gros font ${total(gs)} et les petits ${total(es)} : ce n'est pas pareil !`,
    },
    generate() {
      for (;;) {
        const nums = shuffle(Array.from({ length: 45 }, (_, i) => i + 4)).slice(0, 9);
        const es = nums.slice(0, 5);
        const gs = nums.slice(5);
        const last = total(es) - total(gs);
        if (last < 1 || last > 99 || nums.includes(last)) continue;
        gs.push(last);
        const plant = es.map((e, i) => [gs[i], e]);
        return { seats: withFillers([...es, ...gs]), plant };
      }
    },
  },
  {
    title: 'Quinze de plus',
    rule: 'Chaque gros doudou s\'assoit sur un numéro qui a <b>15 de plus</b> que celui de son petit.',
    formula: `${G} = ${P} + 15`,
    example: 'Exemple : petit sur 23 → gros sur 38 (23 + 15 = 38)',
    pair: relation((e) => `${e} + 15`, (e) => e + 15),
    generate() {
      const plant = makePairs(5, 1, 84, (e) => e + 15);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'Ensemble, ça fait 50',
    rule: 'Dans chaque famille, le numéro du gros <b>plus</b> le numéro du petit doit faire <b>50</b>.',
    formula: `${G} + ${P} = 50`,
    example: 'Exemple : gros sur 32 et petit sur 18 → 32 + 18 = 50 ✓',
    pair: {
      ok: (g, e) => g + e === 50,
      calc: (g, e) => (g + e === 50 ? `${g} + ${e} = 50` : `${g} + ${e} = ${g + e}, pas 50`),
      wrong: (g, e) => `${g} + ${e} = ${g + e}, et pas 50.`,
    },
    generate() {
      const plant = makePairs(5, 1, 49, (e) => 50 - e);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'Le triple',
    rule: 'Chaque gros doudou s\'assoit sur le <b>triple</b> du numéro de son petit.',
    formula: `${G} = ${P} × 3`,
    example: 'Exemple : petit sur 9 → gros sur 27 (9 × 3 = 27)',
    pair: relation((e) => `${e} × 3`, (e) => e * 3),
    generate() {
      const plant = makePairs(5, 2, 33, (e) => e * 3);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'Le carré',
    rule: 'Chaque gros doudou s\'assoit sur le numéro de son petit <b>multiplié par lui-même</b>.',
    formula: `${G} = ${P} × ${P}`,
    example: 'Exemple : petit sur 6 → gros sur 36 (6 × 6 = 36)',
    pair: relation((e) => `${e} × ${e}`, (e) => e * e),
    generate() {
      const plant = makePairs(5, 2, 9, (e) => e * e);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'Le double, plus un',
    rule: 'Chaque gros doudou s\'assoit sur le <b>double</b> du numéro de son petit, <b>plus 1</b>.',
    formula: `${G} = ${P} × 2 + 1`,
    example: 'Exemple : petit sur 12 → 12 × 2 = 24, puis 24 + 1 = 25',
    pair: relation((e) => `${e} × 2 + 1`, (e) => e * 2 + 1),
    generate() {
      const plant = makePairs(5, 1, 49, (e) => e * 2 + 1);
      return { seats: withFillers(plant.flat()), plant };
    },
  },
  {
    title: 'Vingt de plus… et 50 en tout',
    rule: 'Chaque gros a <b>20 de plus</b> que son petit, <b>ET</b> les numéros des 5 petits doivent faire <b>50</b> ensemble.',
    formula: `${G} = ${P} + 20 &nbsp;et&nbsp; les 5 ${P}s font 50`,
    example: 'Attention, il y a des pièges : certaines familles qui respectent « + 20 » ne donnent pas 50 au total !',
    pair: relation((e) => `${e} + 20`, (e) => e + 20),
    sum: kidsTotal(50),
    generate() {
      return makePairsWithKidsTotal((e) => e + 20, 2, 20, 50, 40);
    },
  },
  {
    title: 'Le grand final',
    rule: 'Chaque gros s\'assoit sur <b>le double de son petit, plus 3</b>, <b>ET</b> les numéros des 5 petits doivent faire <b>40</b> ensemble.',
    formula: `${G} = ${P} × 2 + 3 &nbsp;et&nbsp; les 5 ${P}s font 40`,
    example: 'Exemple : petit sur 6 → 6 × 2 + 3 = 15. Et n\'oublie pas le total de 40 !',
    pair: relation((e) => `${e} × 2 + 3`, (e) => e * 2 + 3),
    sum: kidsTotal(40),
    generate() {
      return makePairsWithKidsTotal((e) => e * 2 + 3, 1, 16, 40, 40);
    },
  },
];
