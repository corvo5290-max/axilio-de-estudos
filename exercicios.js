
"use strict";

const API_BASE_URL = "https://axilio-de-estudos.onrender.com";
const STORAGE_KEY = "studymind_exercises_v1";

const $ = (id) => document.getElementById(id);

const elements = {
    subject: $("subject"),
    difficulty: $("difficulty"),
    readyButton: $("ready-button"),
    aiButton: $("ai-button"),
    status: $("status-message"),

    empty: $("question-empty"),
    content: $("question-content"),
    questionSubject: $("question-subject"),
    questionDifficulty: $("question-difficulty"),
    questionSource: $("question-source"),
    counter: $("question-counter"),
    questionText: $("question-text"),
    options: $("options"),

    feedback: $("feedback"),
    feedbackTitle: $("feedback-title"),
    feedbackText: $("feedback-text"),

    checkButton: $("check-button"),
    nextButton: $("next-button"),

    totalAnswered: $("total-answered"),
    totalCorrect: $("total-correct"),
    accuracy: $("accuracy"),

    historyList: $("history-list"),
    clearHistory: $("clear-history")
};

// Banco inicial de questões.
// correct é o índice da alternativa certa, começando em zero.
const QUESTION_BANK = [
    {
        subject: "Matemática",
        difficulty: "Fácil",
        question: "Quanto é 8 × 7?",
        options: ["48", "54", "56", "64"],
        correct: 2,
        explanation: "8 × 7 = 56. Multiplicar 8 por 7 equivale a somar oito sete vezes."
    },
    {
        subject: "Matemática",
        difficulty: "Médio",
        question: "Resolva a equação 3x + 5 = 20.",
        options: ["x = 3", "x = 5", "x = 8", "x = 15"],
        correct: 1,
        explanation: "Subtraindo 5 dos dois lados, temos 3x = 15. Dividindo por 3, x = 5."
    },
    {
        subject: "Matemática",
        difficulty: "Difícil",
        question: "Quais são as soluções da equação x² - 5x + 6 = 0?",
        options: ["1 e 6", "−2 e −3", "2 e 3", "−1 e −6"],
        correct: 2,
        explanation: "Podemos fatorar: (x − 2)(x − 3) = 0. Portanto, x = 2 ou x = 3."
    },

    {
        subject: "Português",
        difficulty: "Fácil",
        question: "Qual destas palavras é um substantivo?",
        options: ["Rapidamente", "Bonito", "Casa", "Correr"],
        correct: 2,
        explanation: "Casa é um substantivo, pois nomeia um ser ou uma coisa."
    },
    {
        subject: "Português",
        difficulty: "Médio",
        question: "Na frase “Ela estudou porque queria aprender”, a palavra “porque” indica:",
        options: ["Oposição", "Causa ou explicação", "Comparação", "Dúvida"],
        correct: 1,
        explanation: "Nesse contexto, “porque” introduz a razão pela qual ela estudou."
    },
    {
        subject: "Português",
        difficulty: "Difícil",
        question: "Na frase “Embora estivesse cansada, continuou estudando”, a oração inicial expressa:",
        options: ["Condição", "Finalidade", "Concessão", "Consequência"],
        correct: 2,
        explanation: "“Embora” introduz uma ideia de concessão: o cansaço não impediu que ela continuasse."
    },

    {
        subject: "História",
        difficulty: "Fácil",
        question: "Em que ano ocorreu a Independência do Brasil?",
        options: ["1500", "1789", "1822", "1889"],
        correct: 2,
        explanation: "A Independência do Brasil foi proclamada em 7 de setembro de 1822."
    },
    {
        subject: "História",
        difficulty: "Médio",
        question: "Qual foi uma característica importante da Revolução Industrial iniciada na Inglaterra?",
        options: [
            "A substituição de todas as cidades por aldeias",
            "A expansão da produção mecanizada nas fábricas",
            "O fim imediato das desigualdades sociais",
            "A proibição do comércio internacional"
        ],
        correct: 1,
        explanation: "A mecanização e o sistema fabril transformaram a produção, o trabalho e a organização social."
    },
    {
        subject: "História",
        difficulty: "Difícil",
        question: "Qual foi uma consequência política importante da Revolução Francesa?",
        options: [
            "O fortalecimento permanente da monarquia absolutista",
            "A extinção imediata de todos os Estados europeus",
            "A difusão de ideias de cidadania e igualdade jurídica",
            "O fim de todas as guerras na Europa"
        ],
        correct: 2,
        explanation: "A Revolução difundiu ideias de cidadania, soberania popular e igualdade perante a lei, embora sua aplicação tenha sido desigual."
    },

    {
        subject: "Geografia",
        difficulty: "Fácil",
        question: "Qual é o maior oceano da Terra?",
        options: ["Atlântico", "Índico", "Ártico", "Pacífico"],
        correct: 3,
        explanation: "O Oceano Pacífico é o maior oceano do planeta."
    },
    {
        subject: "Geografia",
        difficulty: "Médio",
        question: "O que é urbanização?",
        options: [
            "O aumento da proporção da população que vive em áreas urbanas",
            "A redução de todas as cidades a áreas rurais",
            "A mudança do clima de uma região",
            "A formação exclusiva de áreas agrícolas"
        ],
        correct: 0,
        explanation: "Urbanização é o processo pelo qual cresce a participação da população que vive nas cidades."
    },
    {
        subject: "Geografia",
        difficulty: "Difícil",
        question: "Por que a latitude influencia a distribuição das temperaturas na Terra?",
        options: [
            "Porque determina sozinha todas as correntes oceânicas",
            "Porque altera a composição química do ar em cada país",
            "Porque modifica o ângulo de incidência dos raios solares",
            "Porque impede a circulação da atmosfera"
        ],
        correct: 2,
        explanation: "A latitude influencia o ângulo e a distribuição da energia solar recebida, embora altitude, relevo, oceanos e outros fatores também afetem a temperatura."
    },

    {
        subject: "Ciências",
        difficulty: "Fácil",
        question: "Qual órgão bombeia o sangue pelo corpo humano?",
        options: ["Pulmão", "Coração", "Estômago", "Rim"],
        correct: 1,
        explanation: "O coração funciona como uma bomba que impulsiona o sangue pela circulação."
    },
    {
        subject: "Ciências",
        difficulty: "Médio",
        question: "Qual processo permite que as plantas produzam açúcares usando energia da luz?",
        options: ["Fermentação", "Digestão", "Fotossíntese", "Evaporação"],
        correct: 2,
        explanation: "Na fotossíntese, plantas usam energia luminosa para produzir açúcares a partir de água e dióxido de carbono, liberando oxigênio."
    },
    {
        subject: "Ciências",
        difficulty: "Difícil",
        question: "Em uma cadeia alimentar, o que geralmente acontece com a energia disponível ao passar de um nível trófico para o seguinte?",
        options: [
            "Toda a energia é transferida sem perdas",
            "A energia disponível diminui, pois parte é usada e dissipada",
            "A energia se transforma integralmente em matéria",
            "A quantidade de energia sempre dobra"
        ],
        correct: 1,
        explanation: "Organismos utilizam energia em suas atividades e dissipam parte dela como calor. Por isso, menos energia fica disponível nos níveis tróficos seguintes."
    },

    {
        subject: "Inglês",
        difficulty: "Fácil",
        question: "O que significa a palavra inglesa “book”?",
        options: ["Mesa", "Livro", "Janela", "Cadeira"],
        correct: 1,
        explanation: "“Book” significa “livro” em português."
    },
    {
        subject: "Inglês",
        difficulty: "Médio",
        question: "Complete a frase: “She ___ to school every day.”",
        options: ["go", "going", "goes", "gone"],
        correct: 2,
        explanation: "No presente simples, usamos “goes” com he, she e it: “She goes to school every day.”"
    },
    {
        subject: "Inglês",
        difficulty: "Difícil",
        question: "Choose the correct sentence using the present perfect.",
        options: [
            "I have seen that movie yesterday.",
            "I has seen that movie.",
            "I have saw that movie.",
            "I have seen that movie before."
        ],
        correct: 3,
        explanation: "O present perfect é formado por have/has + particípio passado. “I have seen that movie before” está correta. Com um tempo passado específico como “yesterday”, normalmente usamos o simple past."
    }
];

let currentQuestion = null;
let selectedOption = null;
let hasAnswered = false;
let questionNumber = 0;
let requestInProgress = false;

let stats = loadStats();

function loadStats() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!saved || typeof saved !== "object") {
            return { answered: 0, correct: 0, history: [] };
        }

        return {
            answered: Number.isFinite(saved.answered) && saved.answered >= 0
                ? saved.answered : 0,
            correct: Number.isFinite(saved.correct) && saved.correct >= 0
                ? saved.correct : 0,
            history: Array.isArray(saved.history)
                ? saved.history.slice(0, 50) : []
        };
    } catch {
        return { answered: 0, correct: 0, history: [] };
    }
}

function saveStats() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
        console.warn("Não foi possível salvar o progresso:", error);
        setStatus(
            "O navegador não conseguiu salvar o progresso. Verifique o armazenamento disponível.",
            "error"
        );
    }
}

function setStatus(message, type = "") {
    elements.status.textContent = message;
    elements.status.className = "status-message";

    if (type) {
        elements.status.classList.add(type);
    }
}

function updateStats() {
    elements.totalAnswered.textContent = stats.answered;
    elements.totalCorrect.textContent = stats.correct;

    const percentage = stats.answered > 0
        ? Math.round((stats.correct / stats.answered) * 100)
        : 0;

    elements.accuracy.textContent = `${percentage}%`;
    renderHistory();
}

function renderHistory() {
    elements.historyList.replaceChildren();

    if (stats.history.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "Suas respostas aparecerão aqui.";
        elements.historyList.appendChild(empty);
        return;
    }

    stats.history.slice(0, 10).forEach((item) => {
        const row = document.createElement("div");
        row.className = "history-item";

        const result = document.createElement("span");
        result.className = "history-result";
        result.classList.toggle("wrong", !item.correct);
        result.textContent = item.correct ? "✓" : "×";

        const details = document.createElement("div");
        details.className = "history-details";

        const title = document.createElement("strong");
        title.textContent = item.question || "Questão";

        const subtitle = document.createElement("p");
        subtitle.textContent =
            `${item.subject || "Matéria"} · ${item.difficulty || "Nível"} · ` +
            (item.correct ? "Acertou" : "Errou");

        const date = document.createElement("span");
        date.className = "history-date";

        const parsedDate = new Date(item.date);
        date.textContent = Number.isNaN(parsedDate.getTime())
            ? ""
            : parsedDate.toLocaleDateString("pt-BR");

        details.append(title, subtitle);
        row.append(result, details, date);
        elements.historyList.appendChild(row);
    });
}

function setLoading(isLoading) {
    requestInProgress = isLoading;
    elements.readyButton.disabled = isLoading;
    elements.aiButton.disabled = isLoading;
    elements.subject.disabled = isLoading;
    elements.difficulty.disabled = isLoading;

    elements.aiButton.textContent = isLoading
        ? "Gerando questão..."
        : "✳ Gerar com IA";
}

function getFilters() {
    return {
        subject: elements.subject.value,
        difficulty: elements.difficulty.value
    };
}

function getReadyQuestion() {
    const { subject, difficulty } = getFilters();

    const candidates = QUESTION_BANK.filter((item) => {
        const matchesSubject =
            subject === "Todas" || item.subject === subject;

        return matchesSubject && item.difficulty === difficulty;
    });

    if (candidates.length === 0) {
        setStatus(
            "Ainda não há questões prontas para essa combinação. Tente gerar uma com IA.",
            "error"
        );
        return;
    }

    // Evita repetir a mesma pergunta em sequência quando houver alternativas.
    let available = candidates.filter((item) => {
        return !currentQuestion ||
            item.question !== currentQuestion.question ||
            candidates.length === 1;
    });

    if (available.length === 0) {
        available = candidates;
    }

    const question = available[
        Math.floor(Math.random() * available.length)
    ];

    showQuestion(question, "Questão pronta");
    setStatus("Questão pronta para responder.", "success");
}

function showQuestion(question, source) {
    currentQuestion = question;
    selectedOption = null;
    hasAnswered = false;
    questionNumber += 1;

    elements.empty.hidden = true;
    elements.content.hidden = false;
    elements.feedback.hidden = true;
    elements.feedback.classList.remove("incorrect-feedback");

    elements.questionSubject.textContent = question.subject;
    elements.questionDifficulty.textContent = question.difficulty;
    elements.questionSource.textContent = source;
    elements.counter.textContent = `Questão ${questionNumber}`;
    elements.questionText.textContent = question.question;

    elements.options.replaceChildren();

    question.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "option";
        button.setAttribute("aria-pressed", "false");

        const letter = document.createElement("span");
        letter.className = "option-letter";
        letter.textContent = String.fromCharCode(65 + index);

        const text = document.createElement("span");
        text.className = "option-text";
        text.textContent = optionText;

        button.append(letter, text);
        button.addEventListener("click", () => selectAnswer(index));

        elements.options.appendChild(button);
    });

    elements.checkButton.hidden = false;
    elements.checkButton.disabled = true;
    elements.nextButton.hidden = true;
}

function selectAnswer(index) {
    if (hasAnswered || !currentQuestion) return;

    selectedOption = index;

    const buttons = elements.options.querySelectorAll(".option");

    buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    elements.checkButton.disabled = false;
}

function checkAnswer() {
    if (!currentQuestion || hasAnswered || selectedOption === null) {
        return;
    }

    hasAnswered = true;

    const correct = selectedOption === currentQuestion.correct;
    stats.answered += 1;

    if (correct) {
        stats.correct += 1;
    }

    stats.history.unshift({
        question: currentQuestion.question,
        subject: currentQuestion.subject,
        difficulty: currentQuestion.difficulty,
        correct,
        date: new Date().toISOString()
    });

    stats.history = stats.history.slice(0, 50);

    saveStats();
    updateStats();

    const buttons = elements.options.querySelectorAll(".option");

    buttons.forEach((button, index) => {
        button.disabled = true;
        button.classList.remove("selected");

        if (index === currentQuestion.correct) {
            button.classList.add("correct");
        } else if (index === selectedOption && !correct) {
            button.classList.add("incorrect");
        }
    });

    elements.feedback.hidden = false;
    elements.feedback.classList.toggle("incorrect-feedback", !correct);

    elements.feedbackTitle.textContent = correct
        ? "✓ Resposta correta!"
        : "Não foi dessa vez — vamos aprender com o erro.";

    const correctText = currentQuestion.options[currentQuestion.correct];

    elements.feedbackText.textContent = correct
        ? (currentQuestion.explanation || "Muito bem! Você acertou.")
        : `Resposta correta: ${correctText}\n\n` +
          (currentQuestion.explanation || "Revise o conteúdo e tente novamente.");

    elements.checkButton.hidden = true;
    elements.nextButton.hidden = false;

    setStatus(
        correct ? "Boa! Continue assim." : "Confira a explicação antes da próxima questão.",
        correct ? "success" : "error"
    );
}

function nextQuestion() {
    if (requestInProgress) return;

    if (elements.subject.value === "Todas") {
        // Com "Todas", sorteia entre matérias que têm questões no nível escolhido.
        const difficulty = elements.difficulty.value;
        const availableSubjects = [
            ...new Set(
                QUESTION_BANK
                    .filter((item) => item.difficulty === difficulty)
                    .map((item) => item.subject)
            )
        ];

        if (availableSubjects.length > 0) {
            const subject = availableSubjects[
                Math.floor(Math.random() * availableSubjects.length)
            ];

            const candidates = QUESTION_BANK.filter(
                (item) => item.subject === subject &&
                    item.difficulty === difficulty
            );

            const question = candidates[
                Math.floor(Math.random() * candidates.length)
            ];

            showQuestion(question, "Questão pronta");
            setStatus("Nova questão carregada.", "success");
            return;
        }
    }

    getReadyQuestion();
}

function extractJSON(text) {
    let cleaned = String(text || "").trim();

    cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        // Tenta encontrar um objeto JSON dentro de uma resposta com texto extra.
    }

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");

    if (first !== -1 && last > first) {
        return JSON.parse(cleaned.slice(first, last + 1));
    }

    throw new Error("A IA não retornou um JSON válido.");
}

function normalizeAIQuestion(data, filters) {
    // Aceita tanto { question: ... } quanto { questions: [...] }.
    let item = data;

    if (Array.isArray(data)) {
        item = data[0];
    } else if (data && Array.isArray(data.questions)) {
        item = data.questions[0];
    }

    if (!item || typeof item !== "object") {
        throw new Error("A IA não retornou uma questão.");
    }

    const subject = String(item.subject || filters.subject);
    const difficulty = String(item.difficulty || filters.difficulty);
    const question = String(item.question || "").trim();

    const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim())
        : [];

    const correct = Number(item.correct);

    if (!question || question.length > 1500) {
        throw new Error("O enunciado da questão é inválido.");
    }

    if (options.length < 2 || options.length > 6 ||
        options.some((option) => !option || option.length > 500)) {
        throw new Error("As alternativas retornadas são inválidas.");
    }

    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
        throw new Error("A resposta correta retornada é inválida.");
    }

    const allowedSubjects = [
        "Matemática", "Português", "História",
        "Geografia", "Ciências", "Inglês"
    ];

    const allowedDifficulties = ["Fácil", "Médio", "Difícil"];

    return {
        subject: allowedSubjects.includes(subject) ? subject : filters.subject,
        difficulty: allowedDifficulties.includes(difficulty)
            ? difficulty : filters.difficulty,
        question,
        options,
        correct,
        explanation: String(item.explanation || "").slice(0, 3000)
    };
}

async function generateAIQuestion() {
    if (requestInProgress) return;

    const filters = getFilters();

    const requestedSubject = filters.subject === "Todas"
        ? "uma matéria escolar escolhida entre Matemática, Português, História, Geografia, Ciências e Inglês"
        : filters.subject;

    const prompt = `
Crie UMA questão original de exercício escolar em português brasileiro.

Matéria solicitada: ${requestedSubject}.
Dificuldade solicitada: ${filters.difficulty}.

Retorne somente um objeto JSON válido, sem Markdown, sem blocos de código e sem texto antes ou depois.
Use exatamente esta estrutura:
{
  "subject": "nome de uma das matérias permitidas",
  "difficulty": "${filters.difficulty}",
  "question": "enunciado da questão",
  "options": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
  "correct": 0,
  "explanation": "explicação didática da resposta correta"
}

Regras:
- "correct" é o índice da alternativa correta, começando em 0.
- Crie quatro alternativas diferentes.
- Somente uma alternativa pode estar correta.
- A explicação deve ensinar o raciocínio, não apenas repetir a resposta.
- Ajuste o conteúdo ao nível de dificuldade solicitado.
- Evite enunciados ambíguos e informações inventadas.
- Use uma questão diferente e original, não copie questões do banco de exercícios.
`.trim();

    setLoading(true);
    setStatus("Pedindo uma nova questão ao Tutor IA...");

    try {
        const response = await fetch(`${API_BASE_URL}/api/tutor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                payload.detail ||
                `O servidor respondeu com o status ${response.status}.`
            );
        }

        if (!payload || typeof payload.resposta !== "string") {
            throw new Error("A resposta do servidor veio em um formato inesperado.");
        }

        const parsed = extractJSON(payload.resposta);
        const question = normalizeAIQuestion(parsed, filters);

        showQuestion(question, "Gerada por IA");
        setStatus("Questão criada pelo Tutor IA. Boa prática!", "success");
    } catch (error) {
        console.error("Erro ao gerar questão:", error);

        setStatus(
            `Não foi possível gerar a questão: ${error.message}. ` +
            "Você ainda pode praticar com as questões prontas.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}

function clearHistory() {
    if (stats.answered === 0) {
        setStatus("Ainda não há histórico para limpar.");
        return;
    }

    const confirmed = window.confirm(
        "Tem certeza de que deseja apagar o histórico e zerar suas estatísticas? " +
        "Essa ação não pode ser desfeita."
    );

    if (!confirmed) return;

    stats = { answered: 0, correct: 0, history: [] };
    saveStats();
    updateStats();

    setStatus("Histórico e estatísticas apagados.", "success");
}

// Eventos da interface.
elements.readyButton.addEventListener("click", getReadyQuestion);
elements.aiButton.addEventListener("click", generateAIQuestion);
elements.checkButton.addEventListener("click", checkAnswer);
elements.nextButton.addEventListener("click", nextQuestion);
elements.clearHistory.addEventListener("click", clearHistory);

// Atualiza a mensagem quando o estudante muda os filtros.
elements.subject.addEventListener("change", () => {
    setStatus("Matéria alterada. Escolha uma questão para começar.");
});

elements.difficulty.addEventListener("change", () => {
    setStatus("Dificuldade alterada. Escolha uma questão para começar.");
});

// Inicialização.
updateStats();
