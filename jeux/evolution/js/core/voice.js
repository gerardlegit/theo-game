// ============================================================================
// Lecture à voix haute des fiches (synthèse vocale du navigateur, en
// français), utile aux lecteurs débutants.
// ============================================================================

export function canSpeak() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function frenchVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'fr-FR') || voices.find((v) => v.lang && v.lang.startsWith('fr'));
}

export function speak(text) {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.95;
    const v = frenchVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) { /* synthèse indisponible */ }
}

export function stopSpeaking() {
  try { if (canSpeak()) window.speechSynthesis.cancel(); } catch (e) { /* ignoré */ }
}
