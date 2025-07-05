import * as anim from './animations/anim.js'

// Elementos DOM
const screens = {
    0: document.getElementById('screen-0'),
    1: document.getElementById('screen-1'),
    2: document.getElementById('screen-2')
};

const statsTotalTime = document.getElementById('stats-total-time');
const statsCorrectTotal = document.getElementById('stats-correct-total');
const statsWrongTotal = document.getElementById('stats-wrong-total');
const statsInaccuracy = document.getElementById('stats-inaccuracy');
const statsLongestGameTime = document.getElementById('stats-longest-game-time');
const questionText = document.getElementById('question-text');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const optionsContainer = document.getElementById('options-container');

// Elementos de estatísticas
const statsQuestions = document.getElementById('stats-questions');
const statsAccuracy = document.getElementById('stats-accuracy');
const statsHighscore = document.getElementById('stats-highscore');
const statsLastScore = document.getElementById('stats-last-score');
const statsLastQuestions = document.getElementById('stats-last-questions');

//debug
window.exportGameData = function() {
    const sessions = JSON.parse(localStorage.getItem('gameSessions')) || [];
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `retorica-data-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};
window.deathScreen = deathScreen;
window.changeScreen = changeScreen;

//states
export let gameState = {
    currentScreen: 0,
    score: 0,
    timer: 30,
    maxTime: 120,
    timerInterval: null,
    currentQuestion: null,
    currentSession: null,
    allQuestions: [],
    currentQuestionIndex: 0,
    refreshAttempts: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    canAnswer: true, // Controlar a interação
    transitionAnim1: false,
    dieAnim1: false,
    dieAnim2: false,
    Ingame: false,
    timeIncrement: 20, 
    timeDecrement: 10,
    allHints: [], 
    stats: {
        totalQuestions: 0,
        correctAnswers: 0,
        highScore: 0,
        lastScore: 0,
        lastQuestions: 0
    }
};
//sla achei bom separar

window.addEventListener("beforeunload", function (e) {
    if (gameState.Ingame) {
        if (gameState.refreshAttempts === 0) {
            e.preventDefault();
            e.returnValue = ''; // Obrigatório pra alguns navegadores
            gameState.refreshAttempts += 1
        } else if (gameState.refreshAttempts >= 1) {
            location.reload();
        }
    }
    
});

function startNewSession() {
    gameState.currentSession = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        events: [],
        score: 0,
        completed: false
    };
}

function recordEvent(event) {
    if (gameState.currentSession) {
        gameState.currentSession.events.push({
            timestamp: new Date().toISOString(),
            ...event
        });
    }
}

function saveCompletedSession() {
    if (!gameState.currentSession) return;

    gameState.currentSession.endTime = new Date().toISOString();
    gameState.currentSession.completed = true;
    gameState.currentSession.score = gameState.score;

    const sessions = JSON.parse(localStorage.getItem('gameSessions')) || [];
    sessions.push(gameState.currentSession);
    
    // Verifica o tamanho aproximado (em bytes)
    const sessionsSize = JSON.stringify(sessions).length;
    
    // Limite recomendado do localStorage (5MB - com margem de segurança)
    const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB
    
    if (sessionsSize > MAX_STORAGE_SIZE) {
        // Remove as sessões mais antigas até ficar abaixo do limite
        while (sessions.length > 1 && JSON.stringify(sessions).length > MAX_STORAGE_SIZE) {
            sessions.shift(); // Remove a sessão mais antiga
        }
        
        console.warn(`Armazenamento cheio - Sessões antigas foram removidas. Restam ${sessions.length} sessões.`);
    }
    
    localStorage.setItem('gameSessions', JSON.stringify(sessions));
}

function endGame() {
    saveCompletedSession();
    gameState.canAnswer = false;
    gameState.Ingame = false;
}

// Função para mudar de tela
export function changeScreen(screenNumber) {
    // Esconde todas as telas
    Object.values(screens).forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Mostra a tela solicitada
    screens[screenNumber].style.display = 'flex';
    // screens[screenNumber].classList.add('fade-in');
    
    // Ações específicas para cada tela
    if (screenNumber === 1) {
        startGame();
    } else if (screenNumber === 2) {
        updateStats();
    }
}

function deathScreen(action) {
    document.querySelectorAll("deathBTN").disabled = true;
    if (action === 0) {
        changeScreen(0);
        anim.resetAnimation();        
    } else if (action === 1) {
        changeScreen(1);        
        anim.resetAnimation();   
    }
}

// Inicia o jogo
async function startGame() {
    gameState.Ingame = true;
    resetGameState();
    startNewSession();
    updateGameUI();
    
    // Carrega as perguntas
    await loadQuestions();
    
    // Seleciona uma pergunta aleatória
    selectRandomQuestion();
    
    // Inicia o timer
    if (gameState.transitionAnim1 || gameState.dieAnim2) {
        startTimer();
    }else if (gameState.dieAnim1) {
        setTimeout(() => {
            startTimer();
        }, 2500); 
    } else return startTimer();

    gameState.transitionAnim1 = false;
    gameState.dieAnim1 = false;
    gameState.dieAnim2 = false;
    
}

// Carrega as perguntas do GitHub
async function loadQuestions() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/arthuru1722/reto-lib/main/blackquestions.js');
        const text = await response.text();
        
        // Extrai o objeto quizzes do JavaScript
        const quizzes = (new Function(text + '; return quizzes;'))();
        
        // Combina todas as perguntas de todos os quizzes
        gameState.allQuestions = [];
        for (const quizKey in quizzes) {
            if (quizzes.hasOwnProperty(quizKey)) {
                gameState.allQuestions = gameState.allQuestions.concat(quizzes[quizKey].perguntas);
            }
        }
        
        console.log(`Carregadas ${gameState.allQuestions.length} perguntas`);
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
    }
}

// Função para embaralhar array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function selectRandomQuestion() {
    if (gameState.allQuestions.length === 0) {
        console.error('Algo deu errado: Não há perguntas disponíveis');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * gameState.allQuestions.length);
    gameState.currentQuestion = gameState.allQuestions[randomIndex];
    gameState.currentQuestionIndex++;
    gameState.totalQuestions++;
    const respostaCorretaTexto = gameState.currentQuestion.opcoes[gameState.currentQuestion.respostaCorreta];
    gameState.currentQuestion.opcoes = shuffleArray([...gameState.currentQuestion.opcoes]);
    gameState.currentQuestion.respostaCorreta = gameState.currentQuestion.opcoes.indexOf(respostaCorretaTexto);
    
    displayQuestion();
}

// Exibe a pergunta atual
function displayQuestion() {
    if (!gameState.currentQuestion) return;
    
    // Permitir respostas para a nova pergunta
    gameState.canAnswer = true;
    
    questionText.textContent = gameState.currentQuestion.pergunta;
    
    // Limpa as opções anteriores
    optionsContainer.innerHTML = '';
    
    // Adiciona as novas opções (já embaralhadas)
    gameState.currentQuestion.opcoes.forEach((option, index) => {
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.classList.remove('answering', 'correct-highlight', 'incorrect-highlight');
        });
        const optionCard = document.createElement('div');
        optionCard.className = 'slaporra movee option-card flex items-center shadow-stblack border-4 border-black-lp bg-green-lp p-2 h-full md:px-4 md:py-2 lg:min-w-100 md:min-w-80 cursor-pointer';
        optionCard.innerHTML = `
            <div class="flex items-center justify-center w-full">
                <!-- <div class="option-number w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                    ${index + 1}
                </div> -->
                <div class="text-beige-lp font-poppins font-bold text-xl md:text-2xl ">${option}</div>
            </div>
        `;
        
        optionCard.addEventListener('click', () => {
            checkAnswer(index);
        });
        
        optionsContainer.appendChild(optionCard);
    });
}

// Inicia o timer
function startTimer() {
    clearInterval(gameState.timerInterval);
    timerDisplay.textContent = formatTime(gameState.timer);
    gameState.timerInterval = setInterval(() => {
        console.log("a")
        gameState.timer--;
        timerDisplay.textContent = formatTime(gameState.timer);
        
        if (gameState.timer <= 0) {
            clearInterval(gameState.timerInterval);
            anim.tempoEsgotado();
            endGame();
        }
    }, 1000);
}

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}
function showTimeChange(amount, isPositive) {
  const timerDisplay = document.getElementById('timer');
  const changeElement = document.createElement('div');
  
  // Classes Tailwind para posicionamento e animação
  changeElement.className = `h-0 -translate-y-15 text-center font-bold text-xl ${
    isPositive ? 'text-green-500' : 'text-red-500'
  } animate-float-up`;
  
  changeElement.textContent = `${isPositive ? '+' : '-'}${amount}s`;
  timerDisplay.appendChild(changeElement);
  
  setTimeout(() => {
    timerDisplay.removeChild(changeElement);
  }, 1500);
}

// Verifica a resposta
function checkAnswer(selectedIndex) {
    if (!gameState.canAnswer) return;
    
    gameState.canAnswer = false;
    clearInterval(gameState.timerInterval);
    
    const optionElements = optionsContainer.children;
    for (let i = 0; i < optionElements.length; i++) {
        optionElements[i].classList.add('answering');
        optionElements[i].style.pointerEvents = 'none';
    } 
    
    // Obtém o texto das respostas
    const respostaSelecionada = gameState.currentQuestion.opcoes[selectedIndex];
    const respostaCorreta = gameState.currentQuestion.opcoes[gameState.currentQuestion.respostaCorreta];

    recordEvent({
        type: 'answer',
        questionId: gameState.currentQuestion.id,
        questionText: gameState.currentQuestion.pergunta,
        options: [...gameState.currentQuestion.opcoes],
        selectedOption: selectedIndex,
        correctOption: gameState.currentQuestion.respostaCorreta,
        isCorrect: respostaSelecionada === respostaCorreta
    });
    
    if (respostaSelecionada === respostaCorreta) {
        const tempoAtual = gameState.timer;
        const tempoPossivel = gameState.maxTime - tempoAtual;
        const incrementoReal = Math.min(gameState.timeIncrement, tempoPossivel);

        gameState.timer += incrementoReal;
        gameState.score += 10;
        gameState.correctAnswers++;
        updateGameUI();
        
        optionElements[selectedIndex].classList.add('correct-answer');

        if (incrementoReal > 0) {
            showTimeChange(incrementoReal, true);
        }
    } else {
        gameState.timer -= gameState.timeDecrement;
        if (gameState.timer < 0) gameState.timer = 0;
        
        optionElements[selectedIndex].classList.add('wrong-answer');
        optionElements[gameState.currentQuestion.respostaCorreta].classList.add('correct-answer');
        showTimeChange(gameState.timeDecrement, false);
    }

    if (gameState.timer > 0) {
        setTimeout(() => {
            selectRandomQuestion();
            startTimer();
        }, 1500);
    } else {
        anim.startAnimation();
        endGame()
    }
}

// Atualiza a UI com o estado atual do jogo
function updateGameUI() {
    scoreDisplay.textContent = gameState.score;
}

// Atualize a função updateStats()
function updateStats() {
    const sessions = JSON.parse(localStorage.getItem('gameSessions')) || [];
    const completedSessions = sessions.filter(s => s.completed);

    // Calcular estatísticas
    let totalQuestions = 0;
    let correctAnswers = 0;
    let highScore = 0;
    let lastScore = 0;
    let lastQuestions = 0;
    let longestGameTime = 0; // Em segundos
    let totalGameTime = 0;   // Em segundos

    if (completedSessions.length > 0) {
        // Última sessão
        const lastSession = completedSessions[completedSessions.length - 1];
        lastScore = lastSession.score;
        lastQuestions = lastSession.events.filter(e => e.type === 'answer').length;

        // Todas as sessões
        completedSessions.forEach(session => {
            // Contar perguntas e acertos
            const sessionAnswers = session.events.filter(e => e.type === 'answer');
            totalQuestions += sessionAnswers.length;
            correctAnswers += sessionAnswers.filter(a => a.isCorrect).length;
            
            // Pontuação máxima
            if (session.score > highScore) {
                highScore = session.score;
            }
            
            // Calcular duração da partida
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const durationSeconds = (endTime - startTime) / 1000;
            totalGameTime += durationSeconds;
            
            if (durationSeconds > longestGameTime) {
                longestGameTime = durationSeconds;
            }
        });
    }

    // Calcular taxas
    const accuracy = totalQuestions > 0 ? 
        Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    const inaccuracy = totalQuestions > 0 ? 
        Math.round(((totalQuestions - correctAnswers) / totalQuestions) * 100) : 0;

    // Formatar tempos
    const formatTotalTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatGameTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Atualizar UI
    statsQuestions.textContent = totalQuestions;
    statsCorrectTotal.textContent = correctAnswers;
    statsWrongTotal.textContent = totalQuestions - correctAnswers;
    statsAccuracy.textContent = `${accuracy}%`;
    statsInaccuracy.textContent = `${inaccuracy}%`;
    statsHighscore.textContent = highScore;
    statsLongestGameTime.textContent = formatGameTime(longestGameTime);
    statsLastScore.textContent = lastScore;
    statsLastQuestions.textContent = lastQuestions;
    
    // Atualizar tempo total de jogo
    statsTotalTime.textContent = formatTotalTime(totalGameTime);
}

// Reseta o estado do jogo
function resetGameState() {
    gameState.score = 0;
    gameState.timer = 30; // Tempo inicial
    gameState.currentQuestionIndex = 0;
    gameState.totalQuestions = 0;
    gameState.correctAnswers = 0;
    gameState.canAnswer = true;
    clearInterval(gameState.timerInterval);
}

// Inicializa o jogo na tela inicial
changeScreen('2');