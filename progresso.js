"use strict";

(() => {
    const STORAGE_KEY = "studymind_exercises_v2";

    const $ = (id) => document.getElementById(id);

    function carregarDados() {
        try {
            const dados = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

            return {
                answered: Number(dados?.answered) || 0,
                correct: Number(dados?.correct) || 0,
                history: Array.isArray(dados?.history)
                    ? dados.history
                    : [],
                examHistory: Array.isArray(dados?.examHistory)
                    ? dados.examHistory
                    : []
            };
        } catch (erro) {
            console.error(
                "Erro ao carregar o progresso:",
                erro
            );

            return {
                answered: 0,
                correct: 0,
                history: [],
                examHistory: []
            };
        }
    }

    function atualizarTexto(id, valor) {
        const elemento = $(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        if (texto !== undefined) {
            elemento.textContent = texto;
        }

        return elemento;
    }

    function renderizarErros(historico) {
        const container =
            $("progress-mistakes") ||
            $("progress-errors") ||
            $("progress-history");

        if (!container) return;

        container.replaceChildren();

        const erros = historico.filter(
            (item) => item.correct === false
        );

        if (erros.length === 0) {
            container.appendChild(
                criarElemento(
                    "p",
                    "empty-state",
                    "Nenhuma questão errada registrada ainda. Continue praticando!"
                )
            );

            return;
        }

        erros.slice(0, 10).forEach((erro) => {
            const card = criarElemento("article", "mistake-card");

            const materia = criarElemento(
                "p",
                "mistake-subject",
                erro.subject || "Matéria não identificada"
            );

            const pergunta = criarElemento(
                "h3",
                "",
                erro.question || "Questão sem enunciado"
            );

            const resposta = criarElemento(
                "p",
                "mistake-answer",
                erro.selectedAnswer
                    ? `Sua resposta: ${erro.selectedAnswer}`
                    : "Resposta escolhida não registrada."
            );

            const gabarito = criarElemento(
                "p",
                "mistake-correct",
                erro.correctAnswer
                    ? `Resposta correta: ${erro.correctAnswer}`
                    : "Gabarito não registrado no histórico."
            );

            const explicacao = criarElemento(
                "p",
                "mistake-explanation",
                erro.explanation || ""
            );

            card.append(
                materia,
                pergunta,
                resposta,
                gabarito
            );

            if (erro.explanation) {
                card.appendChild(explicacao);
            }

            container.appendChild(card);
        });
    }

    function renderizarMaterias(historico) {
        const container = $("progress-subjects");

        if (!container) return;

        container.replaceChildren();

        const contagem = {};

        historico.forEach((item) => {
            if (item.correct === false) {
                const materia = item.subject || "Outras";
                contagem[materia] = (contagem[materia] || 0) + 1;
            }
        });

        const materias = Object.entries(contagem)
            .sort((a, b) => b[1] - a[1]);

        if (materias.length === 0) {
            container.appendChild(
                criarElemento(
                    "p",
                    "empty-state",
                    "Ainda não há erros registrados por matéria."
                )
            );

            return;
        }

        materias.forEach(([materia, quantidade]) => {
            const linha = criarElemento("div", "subject-error");
            const nome = criarElemento("span", "", materia);
            const total = criarElemento(
                "strong",
                "",
                `${quantidade} ${quantidade === 1 ? "erro" : "erros"}`
            );

            linha.append(nome, total);
            container.appendChild(linha);
        });
    }

    function renderizarProvas(provas) {
        const container = $("progress-exams");

        if (!container) return;

        container.replaceChildren();

        if (provas.length === 0) {
            container.appendChild(
                criarElemento(
                    "p",
                    "empty-state",
                    "Nenhuma prova registrada ainda."
                )
            );

            return;
        }

        provas.slice(0, 5).forEach((prova) => {
            const card = criarElemento("article", "exam-card");

            const titulo = criarElemento(
                "h3",
                "",
                prova.stage
                    ? `Prova: ${prova.stage}`
                    : "Prova realizada"
            );

            const resultado = criarElemento(
                "p",
                "",
                `${Number(prova.correct) || 0} de ${Number(prova.total) || 0} acertos`
            );

            const porcentagem = criarElemento(
                "strong",
                "",
                `${Number(prova.pct) || 0}%`
            );

            card.append(titulo, resultado, porcentagem);
            container.appendChild(card);
        });
    }

    function atualizarProgresso() {
        const dados = carregarDados();

        const respondidas = dados.answered;
        const acertos = dados.correct;

        const porcentagem = respondidas > 0
            ? Math.round((acertos / respondidas) * 100)
            : 0;

        const erros = dados.history.filter(
            (item) => item.correct === false
        ).length;

        atualizarTexto(
            "progress-answered",
            respondidas
        );

        atualizarTexto(
            "progress-accuracy",
            `${porcentagem}%`
        );

        atualizarTexto(
            "progress-correct-count",
            `${acertos} ${acertos === 1 ? "acerto" : "acertos"}`
        );

        atualizarTexto(
            "progress-wrong",
            erros
        );

        atualizarTexto(
            "progress-errors-count",
            erros
        );

        renderizarErros(dados.history);
        renderizarMaterias(dados.history);
        renderizarProvas(dados.examHistory);
    }

    document.addEventListener("DOMContentLoaded", () => {
        atualizarProgresso();

        // Atualiza quando o usuário retorna à página.
        window.addEventListener("pageshow", atualizarProgresso);

        // Atualiza quando outra aba altera o localStorage.
        window.addEventListener("storage", (evento) => {
            if (evento.key === STORAGE_KEY) {
                atualizarProgresso();
            }
        });

        // Atualiza ao navegar para a seção de progresso.
        document.addEventListener("click", (evento) => {
            const alvo = evento.target.closest(
                '[href="#progresso"], [data-page="progresso"], [data-pagina="progresso"]'
            );

            if (alvo) {
                atualizarProgresso();
            }
        });
    });
})();
