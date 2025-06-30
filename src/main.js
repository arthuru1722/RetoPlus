// Elementos DOM
const screens = {
    0: document.getElementById('screen-0'),
    'loading': document.getElementById('loading-screen'),
    1: document.getElementById('screen-1'),
    2: document.getElementById('screen-2'),
    3: document.getElementById('screen-3')
};

const progressBar = document.getElementById('progress-bar');
const continueText = document.getElementById('continue-text');
const questionText = document.getElementById('question-text');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const heartsContainer = document.getElementById('hearts');
const optionsContainer = document.getElementById('options-container');
const finalScoreDisplay = document.getElementById('final-score');
const totalQuestionsDisplay = document.getElementById('total-questions');
const hintText = document.getElementById('hint-text');

// Elementos de estatísticas
const statsQuestions = document.getElementById('stats-questions');
const statsAccuracy = document.getElementById('stats-accuracy');
const statsHighscore = document.getElementById('stats-highscore');
const statsLastScore = document.getElementById('stats-last-score');
const statsLastQuestions = document.getElementById('stats-last-questions');

// Estado do jogo
let gameState = {
    currentScreen: 0,
    lives: 5,
    score: 0,
    timer: 30,
    timerInterval: null,
    currentQuestion: null,
    allQuestions: [],
    currentQuestionIndex: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    canAnswer: true, // Controlar a interação
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

// Função para mudar de tela
function changeScreen(screenNumber) {
    // Esconde todas as telas
    Object.values(screens).forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Mostra a tela solicitada
    screens[screenNumber].style.display = 'flex';
    // screens[screenNumber].classList.add('fade-in');
    
    // Ações específicas para cada tela
    if (screenNumber === 'loading') {
        startLoadingScreen();
    } else if (screenNumber === 1) {
        startGame();
    } else if (screenNumber === 2) {
        finalScoreDisplay.textContent = gameState.score;
        totalQuestionsDisplay.textContent = gameState.totalQuestions;
        updateStats();
    } else if (screenNumber === 3) {
        updateStats();
    }
}

// Tela de loading
async function startLoadingScreen() {
    try {
        // Carrega as dicas primeiro
        await loadHints();
        
        // Mostra uma dica aleatória
        showRandomHint();
        
        // Simula o carregamento
        setTimeout(() => {
            progressBar.classList.add('fade-out');
            setTimeout(() => {
                progressBar.classList.add('hidden');
                continueText.classList.remove('hidden');  
                continueText.classList.add('pulse');
                
                // Quando o usuário clicar, vai para o jogo
                screens['loading'].addEventListener('click', () => {
                    changeScreen(1);
                }, { once: true });
            }, 500);
        }, 3000);
    } catch (error) {
        console.error('Erro na tela de loading:', error);
        // Fallback: vai direto para o jogo se houver erro
        changeScreen(1);
    }
}

async function loadHints() {
    const response = await fetch('https://raw.githubusercontent.com/arthuru1722/reto-lib/main/hints.js');
    if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
    
    let text = await response.text();
    
    // Corrige a vírgula faltante no final
    text = text.replace(
        /"Se você permanecer nessa tela por 10 minutos algo acontecerá... quer descobrir\?"\s*"Digite/g,
        '"Se você permanecer nessa tela por 10 minutos algo acontecerá... quer descobrir?",\n"Digite'
    );
    
    // Extrai apenas o conteúdo do array
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    const arrayContent = text.slice(arrayStart, arrayEnd + 1);
    
    // Analisa o array com tratamento de erro robusto
    try {
        // Primeiro tenta com JSON.parse (mais seguro)
        gameState.allHints = JSON.parse(arrayContent.replace(/'/g, '"'));
    } catch (e) {
        // Se falhar, tenta com eval (mais permissivo)
        try {
            gameState.allHints = eval(`(${arrayContent})`);
        } catch (evalError) {
            console.error('Falha ao analisar dicas:', evalError);
            throw new Error('Formato de dicas inválido');
        }
    }
    
    // Verificação final
    if (!Array.isArray(gameState.allHints)) {
        throw new Error('Dicas não estão em formato de array');
    }
    
    console.log(`Carregadas ${gameState.allHints.length} dicas`);
}
function showRandomHint() {
    if (gameState.allHints.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * gameState.allHints.length);
    hintText.textContent = gameState.allHints[randomIndex];
}

// Inicia o jogo
async function startGame() {
    resetGameState();
    updateGameUI();
    
    // Carrega as perguntas
    await loadQuestions();
    
    // Seleciona uma pergunta aleatória
    selectRandomQuestion();
    
    // Inicia o timer
    startTimer();
}

// Carrega as perguntas do GitHub
async function loadQuestions() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/arthuru1722/reto-lib/main/quizzes.js');
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
        // Perguntas de fallback
        gameState.allQuestions = [
            {
                id: 1,
                pergunta: "Qual é o nome completo de Peter Pan?",
                opcoes: [
                    "Peter James Pan",
                    "Peter Michael Pan",
                    "Peter Banning",
                    "Peter nunca revela seu sobrenome"
                ],
                respostaCorreta: 3
            },
            {
                id: 2,
                pergunta: "Quem é o autor de Peter Pan?",
                opcoes: [
                    "J.K. Rowling",
                    "J.R.R. Tolkien",
                    "J.M. Barrie",
                    "C.S. Lewis"
                ],
                respostaCorreta: 2
            },
            {
                id: 3,
                pergunta: "Qual é o nome da ilha onde Peter Pan vive?",
                opcoes: [
                    "Ilha do Tesouro",
                    "Ilha dos Sonhos",
                    "Terra do Nunca",
                    "Ilha da Magia"
                ],
                respostaCorreta: 2
            },
            {
                id: 4,
                pergunta: "Qual é o nome da fada que acompanha Peter Pan?",
                opcoes: [
                    "Fada Azul",
                    "Sininho",
                    "Fada Morgana",
                    "Fada Madrinha"
                ],
                respostaCorreta: 1
            },
            {
                id: 5,
                pergunta: "Qual é o principal inimigo de Peter Pan?",
                opcoes: [
                    "Capitão Gancho",
                    "Smee",
                    "Crocodilo",
                    "Sr. Smee"
                ],
                respostaCorreta: 0
            },
            {
                id: 6,
                pergunta: "Qual é o nome dos meninos perdidos?",
                opcoes: [
                    "João, Miguel e Pedro",
                    "Eles não têm nomes",
                    "Cada um tem um nome único",
                    "São chamados pelos números"
                ],
                respostaCorreta: 2
            }
        ];
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

// Seleciona uma pergunta aleatória
function selectRandomQuestion() {
    if (gameState.allQuestions.length === 0) {
        console.error('Não há perguntas disponíveis');
        return;
    }
    
    // Seleciona uma pergunta aleatória
    const randomIndex = Math.floor(Math.random() * gameState.allQuestions.length);
    gameState.currentQuestion = gameState.allQuestions[randomIndex];
    gameState.currentQuestionIndex++;
    gameState.totalQuestions++;
    
    // Embaralha as opções de resposta
    gameState.currentQuestion.opcoes = shuffleArray([...gameState.currentQuestion.opcoes]);
    
    // Atualiza a UI com a pergunta
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
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card flex items-center shadow-stblack border-2 border-black-lp bg-green-lp p-2 md:p-4 lg:min-w-100 md:min-w-80 md:min-h-20 cursor-pointer';
        optionCard.innerHTML = `
            <div class="flex items-center justify-center w-full">
                <!-- <div class="option-number w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                    ${index + 1}
                </div> --!>
                <div class="text-beige-lp font-poppins font-bold text-md md:text-2xl">${option}</div>
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
    timerDisplay.textContent = `${gameState.timer}s`;
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer--;
        timerDisplay.textContent = `${gameState.timer}s`;
        
        if (gameState.timer <= 0) {
            // Tempo esgotado - fim de jogo
            clearInterval(gameState.timerInterval);
            changeScreen(2);
        }
    }, 1000);
}

// Verifica a resposta
function checkAnswer(selectedIndex) {
    if (!gameState.canAnswer) return;
    
    gameState.canAnswer = false;
    clearInterval(gameState.timerInterval);
    
    const optionElements = optionsContainer.children;
    
    if (selectedIndex === gameState.currentQuestion.respostaCorreta) {
        // Resposta correta - adiciona tempo
        gameState.timer += gameState.timeIncrement;
        gameState.score += 10;
        gameState.correctAnswers++;
        updateGameUI();
        
        optionElements[selectedIndex].classList.add('correct-answer');
    } else {
        // Resposta errada - remove tempo
        gameState.timer -= gameState.timeDecrement;
        // Garante que o tempo não fique negativo
        if (gameState.timer < 0) gameState.timer = 0;
        
        optionElements[selectedIndex].classList.add('wrong-answer');
        optionElements[gameState.currentQuestion.respostaCorreta].classList.add('correct-answer');
    }
    
    // Avança para a próxima pergunta após 1.5 segundos
    setTimeout(() => {
        if (gameState.timer > 0) {
            selectRandomQuestion();
            startTimer();
        } else {
            changeScreen(2);
        }
    }, 1500);
}

// Manipula resposta errada
function handleWrongAnswer() {
    // Verificar se ainda pode perder vida (evita múltiplas deduções)
    if (gameState.lives > 0) {
        gameState.lives--;
        updateGameUI();
    }
    
    if (gameState.lives <= 0) {
        // Fim de jogo
        setTimeout(() => {
            changeScreen(2);
        }, 1500);
    }
}

// Atualiza a UI com o estado atual do jogo
function updateGameUI() {
    scoreDisplay.textContent = gameState.score;
}

// Atualiza as estatísticas
function updateStats() {
    // Atualiza estatísticas globais
    gameState.stats.totalQuestions += gameState.totalQuestions;
    gameState.stats.correctAnswers += gameState.correctAnswers;
    gameState.stats.lastScore = gameState.score;
    gameState.stats.lastQuestions = gameState.totalQuestions;
    
    if (gameState.score > gameState.stats.highScore) {
        gameState.stats.highScore = gameState.score;
    }
    
    // Calcula a taxa de acertos
    const accuracy = gameState.stats.totalQuestions > 0 
        ? Math.round((gameState.stats.correctAnswers / gameState.stats.totalQuestions) * 100)
        : 0;
    
    // Atualiza a UI de estatísticas
    statsQuestions.textContent = gameState.stats.totalQuestions;
    statsAccuracy.textContent = `${accuracy}%`;
    statsHighscore.textContent = gameState.stats.highScore;
    statsLastScore.textContent = gameState.stats.lastScore;
    statsLastQuestions.textContent = gameState.stats.lastQuestions;
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
//startGame()
