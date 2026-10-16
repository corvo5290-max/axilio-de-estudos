
"use strict";

const STORAGE_KEY = "studymind_exercises_v2";

const $ = (id) => document.getElementById(id);

const elements = {
    totalAnswered: $("total-answered"),
    totalCorrect: $("total-correct"),
    totalWrong: $("total-wrong"),
    accuracy: $("accuracy"),
    subjectStats: $("subject-stats"),
    subjectEmpty: $("subject-empty"),
    subjectFilter: $("subject-filter"),
    attemptFilter: $("attempt-filter"),
    wrongQuestions: $("wrong-questions"),
    wrongEmpty: $("wrong-empty"),
    wrongCount: $("wrong-count"),
    recentHistory: $("recent-history"),
    lastUpdated: $("last-updated"),
    status: $("page-status")
};

function loadStats() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

        return {
            answered: Number(saved.answered) || 0,
            correct: Number(saved.correct) || 0,
            history: Array.isArray(saved.history) ? saved.history : [],
            examHistory: Array.isArray(saved.examHistory)
                ? saved.examHistory
                : []
        };
    } catch (error) {
        console.error("Erro ao ler o progresso:", error);
        return {
            answered: 0,
            correct: 0,
            history: [],
            examHistory: []
        };
    }
}

function formatDate(value) {
    if (!value) return "Data indisponível";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data indisponível";
    }

    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function normalizeHistory(history) {
    return history
        .filter(item =>
            item &&
            typeof item.question === "string" &&
            typeof item.correct === "boolean"
        )
        .map((item, index) => ({
            ...item,
            _index: index,
            subject: item.subject || "Não identificada",
            date: item.date || null
        }));
}

function getLatestAttempts(history) {
    const latest = new Map();

    history.forEach(item => {
        const key = item.questionId || item.question;

        if (!latest.has(key)) {
            latest.set(key, item);
        }
    });

    return [...latest.values()];
}

function renderSummary(history, stats) {
    const total = stats.answered || history.length;
    const correct = stats.correct;
    const wrong = Math.max(0, total - correct);
    const accuracy = total
        ? Math.round((correct / total) * 100)
        : 0;

    elements.totalAnswered.textContent = total;
    elements.totalCorrect.textContent = correct;
    elements.totalWrong.textContent = wrong;
    elements.accuracy.textContent = `${accuracy}%`;
}

function renderSubjectStats(history) {
    elements.subjectStats.replaceChildren();
    elements.subjectFilter.replaceChildren();

    const allOption = createElement(
        "option",
        "",
        "Todas as matérias"
    );

    allOption.value = "Todas";
    elements.subjectFilter.append(allOption);

    const subjects = new Map();

    history.forEach(item => {
        if (!subjects.has(item.subject)) {
            subjects.set(item.subject, {
                total: 0,
                correct: 0,
                wrong: 0
            });
        }

        const data = subjects.get(item.subject);
        data.total++;

        if (item.correct) {
            data.correct++;
        } else {
            data.wrong++;
        }
    });

    [...subjects.keys()]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .forEach(subject => {
            const option = createElement("option", "", subject);
            option.value = subject;
            elements.subjectFilter.append(option);
        });

    if (!subjects.size) {
        elements.subjectEmpty.hidden = false;
        return;
    }

    elements.subjectEmpty.hidden = true;

    [...subjects.entries()]
        .sort((a, b) => {
            const accuracyA = a[1].correct / a[1].total;
            const accuracyB = b[1].correct / b[1].total;
            return accuracyA - accuracyB;
        })
        .forEach(([subject, data]) => {
            const percentage = Math.round(
                (data.correct / data.total) * 100
            );

            const row = createElement("div", "subject-row");
            const name = createElement("span", "subject-name", subject);

            const track = createElement("div", "progress-track");
            const fill = createElement("div", "progress-fill");
            fill.style.width = `${percentage}%`;
            fill.setAttribute(
                "aria-label",
                `${percentage}% de acertos`
            );
            track.append(fill);

            const score = createElement(
                "span",
                "subject-score",
                `${percentage}% · ${data.wrong} erros`
            );

            row.append(name, track, score);
            elements.subjectStats.append(row);
        });
}

function renderWrongQuestions(history) {
    elements.wrongQuestions.replaceChildren();

    let wrong = history.filter(item => !item.correct);

    const selectedSubject = elements.subjectFilter.value;
    const selectedAttempt = elements.attemptFilter.value;

    if (selectedSubject !== "Todas") {
        wrong = wrong.filter(
            item => item.subject === selectedSubject
        );
    }

    if (selectedAttempt === "latest") {
        const latest = getLatestAttempts(history);
        const latestWrongKeys = new Set(
            latest
                .filter(item => !item.correct)
                .map(item => item.questionId || item.question)
        );

        wrong = wrong.filter(item =>
            latestWrongKeys.has(item.questionId || item.question)
        );
    }

    elements.wrongCount.textContent =
        `${wrong.length} ${wrong.length === 1 ? "questão" : "questões"}`;

    elements.wrongEmpty.hidden = wrong.length > 0;

    wrong.forEach(item => {
        const card = createElement("article", "question-card");

        const meta = createElement("div", "question-meta");
        meta.append(
            createElement("span", "", item.subject),
            createElement(
                "span",
                "",
                `${item.year || "Ano não informado"} · ${item.difficulty || "Dificuldade não informada"}`
            ),
            createElement("span", "", formatDate(item.date))
        );

        const title = createElement("h3", "", item.question);
        card.append(meta, title);

        if (item.selectedAnswer !== undefined) {
            const answer = createElement("p", "answer-line answer-wrong");
            answer.append(
                createElement("strong", "", "Sua resposta"),
                document.createTextNode(String(item.selectedAnswer))
            );
            card.append(answer);
        } else {
            card.append(
                createElement(
                    "p",
                    "answer-line answer-wrong",
                    "Sua resposta: não registrada nesta versão antiga do histórico."
                )
            );
        }

        if (item.correctAnswer !== undefined) {
            const answer = createElement("p", "answer-line answer-correct");
            answer.append(
                createElement("strong", "", "Resposta correta"),
                document.createTextNode(String(item.correctAnswer))
            );
            card.append(answer);
        } else {
            card.append(
                createElement(
                    "p",
                    "answer-line answer-correct",
                    "O gabarito desta tentativa não foi salvo no histórico antigo."
                )
            );
        }

        if (item.explanation) {
            card.append(
                createElement("div", "explanation", item.explanation)
            );
        }

        elements.wrongQuestions.append(card);
    });
}

function renderRecentHistory(history) {
    elements.recentHistory.replaceChildren();

    if (!history.length) {
        elements.recentHistory.append(
            createElement(
                "p",
                "empty-state",
                "Suas respostas aparecerão aqui depois que você praticar."
            )
        );
        return;
    }

    history.slice(0, 15).forEach(item => {
        const row = createElement("article", "recent-item");

        const icon = createElement(
            "span",
            `result-icon ${item.correct ? "correct" : "wrong"}`,
            item.correct ? "✓" : "×"
        );

        const details = createElement("div");
        details.append(
            createElement("div", "recent-question", item.question),
            createElement(
                "div",
                "recent-sub",
                `${item.subject} · ${item.year || "Ano não informado"} · ${formatDate(item.date)}`
            )
        );

        const result = createElement(
            "span",
            "recent-result",
            item.correct ? "Acertou" : "Errou"
        );

        row.append(icon, details, result);
        elements.recentHistory.append(row);
    });
}

function render() {
    const stats = loadStats();
    const history = normalizeHistory(stats.history);

    renderSummary(history, stats);
    renderSubjectStats(history);
    renderWrongQuestions(history);
    renderRecentHistory(history);

    elements.lastUpdated.textContent =
        `Atualizado em ${new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        })}`;

    elements.status.textContent =
        "Estatísticas calculadas a partir do histórico salvo neste navegador.";
}

elements.subjectFilter.addEventListener("change", () => {
    renderWrongQuestions(normalizeHistory(loadStats().history));
});

elements.attemptFilter.addEventListener("change", () => {
    renderWrongQuestions(normalizeHistory(loadStats().history));
});

window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
        render();
    }
});

render();
