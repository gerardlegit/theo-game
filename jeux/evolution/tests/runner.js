// ============================================================================
// Mini lanceur de tests (pas de Node sur la machine) : les tests tournent dans
// le navigateur, s'affichent sur la page et sont renvoyés au script
// run_tests.py par une requête POST /__log.
// ============================================================================

const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function ok(cond, msg = 'condition fausse') {
  if (!cond) throw new Error(msg);
}

export function eq(actual, expected, msg = '') {
  if (actual !== expected) throw new Error(`${msg} attendu ${expected}, obtenu ${actual}`.trim());
}

export function near(actual, expected, eps = 1e-6, msg = '') {
  if (!(Math.abs(actual - expected) <= eps)) {
    throw new Error(`${msg} attendu ≈ ${expected} (± ${eps}), obtenu ${actual}`.trim());
  }
}

export async function run(suite) {
  const results = [];
  for (const t of tests) {
    try {
      await t.fn();
      results.push({ name: t.name, ok: true });
    } catch (e) {
      results.push({ name: t.name, ok: false, error: String(e && e.message || e) });
    }
  }
  tests.length = 0;
  report(suite, results);
  return results;
}

function report(suite, results) {
  const failed = results.filter((r) => !r.ok).length;
  const box = document.createElement('section');
  box.innerHTML = `<h2>${suite} : ${results.length - failed} / ${results.length} ✔</h2>`;
  const ul = document.createElement('ul');
  for (const r of results) {
    const li = document.createElement('li');
    li.textContent = `${r.ok ? '✔' : '✘'} ${r.name}${r.ok ? '' : ' — ' + r.error}`;
    li.style.color = r.ok ? '#1d7a3a' : '#c0392b';
    ul.appendChild(li);
  }
  box.appendChild(ul);
  document.body.appendChild(box);
  fetch('/__log', { method: 'POST', body: JSON.stringify({ suite, results }) }).catch(() => {});
}
