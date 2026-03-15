import { createSessionState, getTopicText, storeTopic } from '../state/sessionState.js';
import { buildBidirectionalDeck, parseTopicText } from '../services/cardParser.js';
import { persistDifficultWord } from '../services/recommendationStore.js';
import { fetchTopicFiles, fetchTopicManifest } from '../services/topicLoader.js';
import { createQuizEngine } from '../controllers/quizEngine.js';
import { formatPronunciation, formatTopicName } from '../utils/format.js';
import { $, clearChildren, hide, show } from './dom.js';
import { createModal } from './modal.js';

export function initApp() {
    const state = createSessionState();
    const quiz = createQuizEngine(state);
    const modal = createModal();

    const elements = {
        serverInstructions: $('server-instructions'),
        topicContainer: $('topic-container'),
        topicList: $('topic-list'),
        setupScreen: $('setup-screen'),
        quizScreen: $('quiz-screen'),
        startBtn: $('start-btn'),
        mainMenuBtn: $('main-menu-btn'),
        scoreText: $('score-text'),
        queueText: $('queue-text'),
        progressFill: $('progress-fill'),
        targetWord: $('target-word'),
        targetPron: $('target-pron'),
        speechControls: $('speech-controls'),
        mcUi: $('mc-ui'),
        openUi: $('open-ui'),
        ansRevealBtn: $('ans-reveal-btn'),
        speakSlowBtn: $('speak-slow-btn'),
        speakFastBtn: $('speak-fast-btn'),
        ansSpeechControls: $('ans-speech-controls'),
        ansSpeakSlowBtn: $('ans-speak-slow-btn'),
        ansSpeakFastBtn: $('ans-speak-fast-btn'),
        ansBox: $('ans-box'),
        yesBtn: $('yes-btn'),
        noBtn: $('no-btn'),
        skipBtn: $('skip-btn'),
        modeLabel: $('mode-label'),
        correctAns: $('correct-ans'),
    };

    let activeCard = null;
    let activeMode = 'open';
    const speechSupported = 'speechSynthesis' in window;
    const SLOW_SPEECH_RATE = 0.3;
    const FAST_SPEECH_RATE = 1.15;

    elements.startBtn.addEventListener('click', startSession);
    elements.mainMenuBtn.addEventListener('click', returnToMainMenu);
    elements.ansRevealBtn.addEventListener('click', () => {
        show(elements.ansBox);
        toggleAnswerSpeechControls();
        hide(elements.skipBtn);
    });
    elements.speakSlowBtn.addEventListener('click', () => {
        if (!activeCard) return;
        speakCardQuestion(activeCard, SLOW_SPEECH_RATE);
    });
    elements.speakFastBtn.addEventListener('click', () => {
        if (!activeCard) return;
        speakCardQuestion(activeCard, FAST_SPEECH_RATE);
    });
    elements.ansSpeakSlowBtn.addEventListener('click', () => {
        if (!activeCard) return;
        speakCardAnswer(activeCard, SLOW_SPEECH_RATE);
    });
    elements.ansSpeakFastBtn.addEventListener('click', () => {
        if (!activeCard) return;
        speakCardAnswer(activeCard, FAST_SPEECH_RATE);
    });
    elements.yesBtn.addEventListener('click', () => handleAnswer(true));
    elements.noBtn.addEventListener('click', () => handleAnswer(false));
    elements.skipBtn.addEventListener('click', () => handleSkip());

    if (location.protocol === 'file:') {
        show(elements.serverInstructions);
        return;
    }

    loadTopics().then(ok => {
        if (!ok) show(elements.serverInstructions);
    });

    async function loadTopics() {
        const names = await fetchTopicManifest();
        if (!names || names.length === 0) return false;
        const topics = await fetchTopicFiles(names);
        if (!topics.length) return false;

        elements.topicContainer.classList.remove('hidden');
        renderTopicList(topics);
        return true;
    }

    function renderTopicList(topics) {
        clearChildren(elements.topicList);
        topics.forEach(({ name, text }) => {
            storeTopic(state, name, text);
            const row = document.createElement('div');
            row.className = 'topic-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'topic-cb';
            checkbox.id = name;

            const label = document.createElement('label');
            label.htmlFor = name;
            label.textContent = formatTopicName(name);

            checkbox.addEventListener('click', e => e.stopPropagation());
            row.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
            });

            row.append(checkbox, label);
            elements.topicList.appendChild(row);
        });
    }

    function startSession() {
        const selected = [...document.querySelectorAll('.topic-cb:checked')].map(cb => cb.id);
        const cards = selected.flatMap(id => parseTopicText(getTopicText(state, id)));

        if (cards.length === 0) {
            modal.open('Empty Selection', 'Please select at least one topic with vocabulary.');
            return;
        }

        const deck = buildBidirectionalDeck(cards);
        quiz.startSession(deck);
        show(elements.quizScreen);
        hide(elements.setupScreen);
        updateScoreboard();
        renderNextCard();
    }

    function renderNextCard() {
        stopSpeaking();
        if (!quiz.hasCards()) {
            const finalStats = quiz.stats();
            modal.open('🎉 All Done!', `Final Score: ${finalStats.score}/${finalStats.total}`, () => {
                hide(elements.quizScreen);
                show(elements.setupScreen);
                show(elements.skipBtn);
                hide(elements.ansBox);
            });
            return;
        }

        const card = quiz.currentCard();
        activeCard = card;
        activeMode = quiz.shouldUseMultipleChoice() ? 'mc' : 'open';

        elements.modeLabel.textContent = activeMode === 'mc' ? 'Multiple Choice' : 'Open Recall';
        elements.targetWord.textContent = card.question.toLowerCase();
        elements.targetPron.textContent = card.dir === 'Rus ➔ Eng' ? formatPronunciation(card.pron) : '';
        if (activeMode === 'open' && speechSupported && card.dir === 'Rus ➔ Eng') show(elements.speechControls);
        else hide(elements.speechControls);
        hide(elements.ansBox);
        hide(elements.ansSpeechControls);
        show(elements.skipBtn);

        if (activeMode === 'mc') setupMultipleChoice(card);
        else setupOpenRecall(card);

        updateScoreboard();
    }

    function setupMultipleChoice(card) {
        show(elements.mcUi);
        hide(elements.openUi);
        elements.mcUi.innerHTML = '';

        const choices = buildChoices(card);
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = choice.toLowerCase();
            btn.addEventListener('click', () => {
                if (choice === card.answer) {
                    handleAnswer(true);
                } else {
                    const hint = card.pron ? `<div style="color:var(--accent);font-style:italic;margin-top:4px;">${formatPronunciation(card.pron)}</div>` : '';
                    const body =
                        `<div style="font-size:1.3rem;font-weight:800;color:var(--primary);margin-bottom:12px;">"${card.question.toLowerCase()}"</div>` +
                        `The correct answer was:<br><strong style="font-size:1.2rem;">${card.answer.toLowerCase()}</strong>${hint}`;
                    modal.open('❌ Not quite!', body, () => handleAnswer(false));
                }
            });
            elements.mcUi.appendChild(btn);
        });
    }

    function setupOpenRecall(card) {
        hide(elements.mcUi);
        show(elements.openUi);
        if (card.dir === 'Eng ➔ Rus' && card.pron) {
            elements.correctAns.innerHTML = `${card.answer.toLowerCase()}<div style="color:var(--accent);font-style:italic;font-size:1rem;margin-top:8px;">${formatPronunciation(card.pron)}</div>`;
        } else {
            elements.correctAns.textContent = card.answer.toLowerCase();
        }
    }

    function buildChoices(card) {
        const answers = state.masterList.filter(entry => entry.dir === card.dir).map(entry => entry.answer);
        const options = [card.answer];
        const pool = answers.filter(ans => ans !== card.answer).sort(() => Math.random() - 0.5);
        for (const option of pool) {
            if (options.length >= 4) break;
            options.push(option);
        }
        return options.sort(() => Math.random() - 0.5);
    }

    function handleAnswer(correct) {
        const answerOutcome = quiz.recordAnswer(correct);

        if (answerOutcome?.movedToDifficult && answerOutcome.difficultEntry) {
            void persistDifficultWord(answerOutcome.difficultEntry);
            modal.open(
                'Moved To Review List',
                `"${answerOutcome.difficultEntry.eng.toLowerCase()}" was added to <strong>difficult_words_YYYY-MM-DD.txt</strong> after 3 mistakes.`,
                continueAfterAnswer
            );
            return;
        }

        continueAfterAnswer();
    }

    function continueAfterAnswer() {
        hide(elements.ansBox);
        hide(elements.ansSpeechControls);
        show(elements.skipBtn);
        renderNextCard();
    }

    function returnToMainMenu() {
        stopSpeaking();
        activeCard = null;
        hide(elements.ansBox);
        hide(elements.ansSpeechControls);
        show(elements.skipBtn);
        hide(elements.quizScreen);
        show(elements.setupScreen);
    }

    function handleSkip() {
        if (!activeCard) return;
        const hint = activeCard.pron ? `<div style="color:var(--accent);font-style:italic;margin-top:4px;">${formatPronunciation(activeCard.pron)}</div>` : '';
        const body =
            `<div style="font-size:1.3rem;font-weight:800;color:var(--primary);margin-bottom:12px;">"${activeCard.question.toLowerCase()}"</div>` +
            `The answer is:<br><strong style="font-size:1.2rem;">${activeCard.answer.toLowerCase()}</strong>${hint}`;
        modal.open('📖 Study This Word', body, () => {
            const skipOutcome = quiz.skipCurrentToDifficult();
            if (skipOutcome?.movedToDifficult && skipOutcome.difficultEntry) {
                void persistDifficultWord(skipOutcome.difficultEntry);
            }
            continueAfterAnswer();
        });
    }

    function updateScoreboard() {
        const { score, total, remaining } = quiz.stats();
        elements.scoreText.textContent = `Score: ${score}`;
        elements.queueText.textContent = `Cards Left: ${remaining}`;
        elements.progressFill.style.width = `${quiz.progressPercent()}%`;
    }

    function speakCardQuestion(card, rate) {
        if (card.dir !== 'Rus ➔ Eng') return;
        speakText(card.question, 'ru-RU', rate);
    }

    function speakCardAnswer(card, rate) {
        if (card.dir !== 'Eng ➔ Rus') return;
        speakText(card.answer, 'ru-RU', rate);
    }

    function toggleAnswerSpeechControls() {
        const shouldShow =
            speechSupported &&
            activeMode === 'open' &&
            activeCard &&
            activeCard.dir === 'Eng ➔ Rus';

        if (shouldShow) show(elements.ansSpeechControls);
        else hide(elements.ansSpeechControls);
    }

    function speakText(text, lang, rate) {
        if (!('speechSynthesis' in window) || !text) return;
        stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }

    function stopSpeaking() {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
    }
}
