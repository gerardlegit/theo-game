// ============================================================================
// Les deux courses : multiplications (tables de 2 à 10) et additions
// (de plus en plus grandes au fil de la course).
// ============================================================================

export const MODES = {
  mul: {
    id: 'mul',
    symbol: '×',
    name: 'Multiplications',
    title: 'La Course des Multiplications',
    hint: 'Les tables de 2 à 10',
    // "-2" : classement ouvert depuis l'arrivée des bonus ×2 et des papis
    gameId: 'course-multiplications-2',
  },
  add: {
    id: 'add',
    symbol: '+',
    name: 'Additions',
    title: 'La Course des Additions',
    hint: 'Des petits nombres jusqu’à 100',
    gameId: 'course-additions-1',
  },
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deux mauvaises réponses prises dans les pièges, en priorité dans les premiers
function pickWrong(answer, preferred, others = []) {
  const clean = (list) => [...new Set(list.filter((n) => n > 0 && n !== answer))];
  const first = shuffle(clean(preferred));
  const rest = shuffle(clean(others).filter((n) => !first.includes(n)));
  return [...first, ...rest].slice(0, 2);
}

function makeMultiplication(used) {
  let a, b, key;
  do {
    a = randInt(2, 10);   // la table
    b = randInt(1, 10);
    key = `${a}x${b}`;
  } while (used.has(key));
  used.add(key);

  const answer = a * b;
  // Les mauvaises réponses ressemblent à la bonne : table voisine, résultat voisin…
  const wrong = pickWrong(answer, [
    a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10,
  ]);
  // On affiche parfois "7 × 3", parfois "3 × 7"
  const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return { a: x, b: y, symbol: '×', answer, options: shuffle([answer, ...wrong]) };
}

// Trois paliers : 3 questions faciles, 3 moyennes, 3 plus grandes
function addOperands(index) {
  if (index < 3) return [randInt(2, 9), randInt(2, 9)];                 // 7 + 5
  if (index < 6) return [randInt(11, 79), randInt(3, 9)];               // 47 + 8
  const a = randInt(12, 59);
  return [a, randInt(11, Math.min(59, 99 - a))];                         // 36 + 27
}

function makeAddition(used, index) {
  let a, b, key;
  do {
    [a, b] = addOperands(index);
    key = `${Math.min(a, b)}+${Math.max(a, b)}`;
  } while (used.has(key));
  used.add(key);

  const answer = a + b;
  const carry = (a % 10) + (b % 10) >= 10;
  // Pièges : un de plus ou de moins, et la retenue oubliée (ou ajoutée en trop)
  const preferred = index < 3
    ? [answer + 1, answer - 1, answer + 2, answer - 2]
    : [answer + 1, answer - 1, carry ? answer - 10 : answer + 10, answer + 10];
  const wrong = pickWrong(answer, preferred, [answer + 2, answer - 2, answer + 11, answer - 9]);
  const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return { a: x, b: y, symbol: '+', answer, options: shuffle([answer, ...wrong]) };
}

/** Une nouvelle question pour le mode donné (index = 0 pour la première). */
export function makeQuestion(mode, index, used) {
  return mode === 'add' ? makeAddition(used, index) : makeMultiplication(used);
}
