const STORAGE_KEY = 'royaume-des-mots-save';

const CHARACTERS = [
  { id: 'wizard', emoji: '🧙', label: 'Magicien' },
  { id: 'explorer', emoji: '🧝', label: 'Exploratrice' },
  { id: 'knight', emoji: '🛡️', label: 'Chevalier' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
];

const WORLDS = [
  { id: 'grammaire', emoji: '🏰', title: 'Château des Phrases', label: 'Grammaire' },
  { id: 'conjugaison', emoji: '⏳', title: 'Vallée du Temps', label: 'Conjugaison' },
  { id: 'orthographe', emoji: '⚒️', title: 'Forge des Accords', label: 'Orthographe' },
  { id: 'vocabulaire', emoji: '🌳', title: 'Forêt des Mots', label: 'Vocabulaire' },
  { id: 'lecture', emoji: '📚', title: 'Bibliothèque', label: 'Lecture' },
];
const DAILY_META = { emoji: '⚡', title: 'Mission du jour' };

/* ---------- Sauvegarde locale ---------- */
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        character: parsed.character || null,
        stars: Number(parsed.stars) || 0,
        completedMissions: Number(parsed.completedMissions) || 0,
      };
    }
  } catch (e) { /* stockage indisponible : on repart d'une sauvegarde vide */ }
  return { character: null, stars: 0, completedMissions: 0 };
}
function writeSave() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
}
let save = loadSave();

/* ---------- Références DOM ---------- */
const screenCharacter = document.getElementById('screenCharacter');
const screenHome = document.getElementById('screenHome');
const screenMission = document.getElementById('screenMission');

const characterGrid = document.getElementById('characterGrid');
const starsCount = document.getElementById('starsCount');
const avatarBadge = document.getElementById('avatarBadge');
const worldsGrid = document.getElementById('worldsGrid');
const missionOfDayBtn = document.getElementById('missionOfDayBtn');

const missionBackBtn = document.getElementById('missionBackBtn');
const missionProgress = document.getElementById('missionProgress');
const questCard = document.getElementById('questCard');
const questWorldLabel = document.getElementById('questWorldLabel');
const questPassage = document.getElementById('questPassage');
const questQuestion = document.getElementById('questQuestion');
const questAnswers = document.getElementById('questAnswers');

const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackExplanation = document.getElementById('feedbackExplanation');
const feedbackBtn = document.getElementById('feedbackBtn');

const missionComplete = document.getElementById('missionComplete');
const completeStars = document.getElementById('completeStars');
const replayBtn = document.getElementById('replayBtn');
const mapBtn = document.getElementById('mapBtn');

/* ---------- Utilitaires ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}
function worldMeta(worldId) {
  return WORLDS.find((w) => w.id === worldId) || DAILY_META;
}

/* ---------- Navigation entre écrans ---------- */
function showScreen(section) {
  [screenCharacter, screenHome, screenMission].forEach((s) => {
    s.hidden = s !== section;
  });
}

/* ---------- Écran 1 : personnage ---------- */
function renderCharacterGrid() {
  characterGrid.innerHTML = '';
  CHARACTERS.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'character-btn';
    btn.innerHTML = `<span class="character-emoji">${c.emoji}</span><span>${c.label}</span>`;
    btn.addEventListener('click', () => {
      save.character = c.id;
      writeSave();
      goHome();
    });
    characterGrid.appendChild(btn);
  });
}

/* ---------- Écran 2 : carte des mondes ---------- */
function goHome() {
  const char = CHARACTERS.find((c) => c.id === save.character) || CHARACTERS[0];
  starsCount.textContent = String(save.stars);
  avatarBadge.textContent = char.emoji;
  showScreen(screenHome);
}

function renderWorldsGrid() {
  worldsGrid.innerHTML = '';
  WORLDS.forEach((w) => {
    const btn = document.createElement('button');
    btn.className = 'world-btn';
    btn.innerHTML = `
      <span class="world-emoji">${w.emoji}</span>
      <span class="world-label">${w.title}</span>
      <span class="world-sub">${w.label}</span>
    `;
    btn.addEventListener('click', () => startMission(w.id));
    worldsGrid.appendChild(btn);
  });
}

/* ---------- Construction d'une mission ---------- */
function buildCategoryMission(worldId) {
  const pool = (QUESTIONS[worldId] || []).map((q) => ({ ...q, worldId }));
  return pickN(pool, 5);
}

function buildDailyMission() {
  const all = [];
  Object.keys(QUESTIONS).forEach((worldId) => {
    QUESTIONS[worldId].forEach((q) => all.push({ ...q, worldId }));
  });
  const easy = all.filter((q) => q.difficulty === 1);
  const medium = all.filter((q) => q.difficulty === 2);
  const hard = all.filter((q) => q.difficulty === 3);

  let chosen = [...pickN(easy, 2), ...pickN(medium, 2), ...pickN(hard, 1)];
  if (chosen.length < 5) chosen = pickN(all, 5); // filet de sécurité
  return shuffle(chosen);
}

/* ---------- Déroulement d'une mission ---------- */
let currentMission = [];
let currentIndex = 0;
let missionStars = 0;
let selectedAnswerIndex = null;
let answered = false;
let lastMissionType = 'daily';
let validateBtn = null;

function startMission(type) {
  lastMissionType = type;
  currentMission = type === 'daily' ? buildDailyMission() : buildCategoryMission(type);
  currentIndex = 0;
  missionStars = 0;
  showScreen(screenMission);
  questCard.hidden = false;
  missionComplete.hidden = true;
  renderQuestion();
}

function ensureValidateButton() {
  if (!validateBtn) {
    validateBtn = document.createElement('button');
    validateBtn.className = 'validate-btn';
    validateBtn.textContent = 'Valider';
    validateBtn.addEventListener('click', onValidate);
    questCard.appendChild(validateBtn);
  }
  validateBtn.hidden = false;
  validateBtn.disabled = true;
}

function renderQuestion() {
  feedbackPanel.hidden = true;
  questCard.hidden = false;

  const q = currentMission[currentIndex];
  const meta = worldMeta(q.worldId);
  questWorldLabel.textContent = `${meta.emoji} ${meta.title}`;
  missionProgress.textContent = `${currentIndex + 1} / ${currentMission.length}`;

  if (q.passage) {
    questPassage.hidden = false;
    questPassage.textContent = q.passage;
  } else {
    questPassage.hidden = true;
  }

  questQuestion.textContent = q.question;

  questAnswers.innerHTML = '';
  selectedAnswerIndex = null;
  answered = false;

  q.answers.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.type = 'button';
    btn.textContent = ans;
    btn.addEventListener('click', () => selectAnswer(i, btn));
    questAnswers.appendChild(btn);
  });

  ensureValidateButton();
}

function selectAnswer(index, btn) {
  if (answered) return;
  Array.from(questAnswers.children).forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedAnswerIndex = index;
  validateBtn.disabled = false;
}

function onValidate() {
  if (selectedAnswerIndex === null || answered) return;
  answered = true;

  const q = currentMission[currentIndex];
  const isCorrect = selectedAnswerIndex === q.correct;

  Array.from(questAnswers.children).forEach((b, i) => {
    b.classList.remove('selected');
    b.disabled = true;
    if (i === q.correct) b.classList.add('correct');
    else if (i === selectedAnswerIndex) b.classList.add('wrong');
  });
  validateBtn.hidden = true;

  feedbackPanel.hidden = false;
  feedbackPanel.className = 'feedback-panel ' + (isCorrect ? 'good' : 'retry');
  feedbackTitle.textContent = isCorrect ? '✨ Bien joué !' : '💡 Presque !';
  feedbackExplanation.textContent = q.explanation;

  if (isCorrect) {
    missionStars += 1;
    save.stars += 1;
    writeSave();
    feedbackBtn.textContent = currentIndex < currentMission.length - 1 ? 'Continuer' : 'Voir le résultat';
    feedbackBtn.onclick = nextQuestion;
  } else {
    feedbackBtn.textContent = 'Réessayer';
    feedbackBtn.onclick = () => renderQuestion();
  }
}

function nextQuestion() {
  currentIndex += 1;
  if (currentIndex >= currentMission.length) {
    finishMission();
  } else {
    renderQuestion();
  }
}

function finishMission() {
  questCard.hidden = true;
  feedbackPanel.hidden = true;
  missionComplete.hidden = false;

  save.completedMissions += 1;
  writeSave();

  completeStars.innerHTML = '';
  const total = currentMission.length;
  for (let i = 0; i < total; i++) {
    const span = document.createElement('span');
    span.className = 'complete-star';
    span.style.animationDelay = `${i * 0.12}s`;
    span.textContent = i < missionStars ? '⭐' : '☆';
    completeStars.appendChild(span);
  }
}

/* ---------- Boutons globaux ---------- */
missionOfDayBtn.addEventListener('click', () => startMission('daily'));
replayBtn.addEventListener('click', () => startMission(lastMissionType));
mapBtn.addEventListener('click', goHome);
missionBackBtn.addEventListener('click', goHome);

/* ---------- Démarrage ---------- */
renderCharacterGrid();
renderWorldsGrid();

if (save.character) {
  goHome();
} else {
  showScreen(screenCharacter);
}
