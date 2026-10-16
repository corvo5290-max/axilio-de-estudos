"use strict";

(() => {
    const STORAGE_KEY = "studymind_exercises_v2";

    const $ = (id) => document.getElementById(id);

    function carregarDados() {
        try {
            const bruto = localStorage.getItem(STORAGE_KEY);

            if (!bruto) {
                return {
                    answered: 0,
                    correct: 0,
                    history: [],
                    examHistory: []
                };
            }

            const dados = JSON.parse(bruto);

            return {
                answered: Number(dados.answered) || 0,
                correct: Number(dados.correct) || 0,
                history: Array.isArray(dados.history)
                    ? dados.history
                    : [],
                examHistory: Array.isArray(dados.examHistory)
                    ? dados.examHistory
                    : []
            };
        } catch (erro) {
            console.error("Erro ao carregar progresso:", erro);

            return {
                answered: 0,
                correct: 0,
                history: [],
                examHistory: []
            };
        }
    }

    function texto(id, valor) {
        const elemento = $(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function criarElemento(tag, classe, conteudo) {
        const elemento = document.createElement(tag);

        if (classe) elemento.className = classe;

        if (conteudo !== undefined) {
            elemento.textContent = conteudo;
        }

        return elemento;
    }

    function obterErros(historico) {
        return historico.filter(item =>
            item.correct === false ||
            item.correct === "false" ||
            item.correct === 0
        );
    }

    function renderizarMaterias(historico) {
        const container = $("progress-subjects");
        if (!container) return;

        container.replaceChildren();

        const contagem = {};

        obterErros(historico).forEach(item => {
            const materia = item.subject || "Outras matérias";
            contagem[materia] = (contagem[materia] || 0) + 1;
        });

        const materias = Object.entries(contagem)
            .sort((a, b) => b[1] - a[1]);

        if (!materias.length) {
            container.appendChild(
                criarElemento(
                    "p",
                    "muted",
                    "Nenhum erro registrado para revisar."
                )
            );
            return;
        }

        materias.forEach(([materia, quantidade]) => {
            const linha = criarElemento("div", "subject-error");

            linha.append(
                criarElemento("span", "", materia),
                criarElemento(
                    "strong",
                    "",
                    `${quantidade} ${quantidade === 1 ? "erro" : "erros"}`
                )
            );

            container.appendChild(linha);
        });
    }

    function renderizarErros(historico) {
        const container = $("progress-mistakes");
        if (!container) return;

        container.replaceChildren();

        const erros = obterErros(historico);

        if (!erros.length) {
            container.appendChild(
                criarElemento(
                    "p",
                    "muted",
                    "Nenhuma questão errada registrada ainda."
                )
            );
            return;
        }

        erros.slice(0, 10).forEach(item => {
            const card = criarElemento("article", "mistake-card");

            card.appendChild(
                criarElemento(
                    "p",
                    "mistake-subject",
                    item.subject || "Matéria não identificada"
                )
            );

            card.appendChild(
                criarElemento(
                    "h3",
                    "",
                    item.question || "Questão sem enunciado"
                )
            );

            if (item.selectedAnswer) {
                card.appendChild(
                    criarElemento(
                        "p",
                        "",
                        `Sua resposta: ${item.selectedAnswer}`
                    )
                );
            }

            if (item.correctAnswer) {
                card.appendChild(
                    criarElemento(
                        "p",
                        "",
                        `Resposta correta: ${item.correctAnswer}`
                    )
                );
            }

            if (item.explanation) {
                card.appendChild(
                    criarElemento(
                        "p",
                        "muted",
                        item.explanation
                    )
                );
            }

            container.appendChild(card);
        });
    }

    function renderizarProvas(provas) {
        const container = $("progress-exams");
        if (!container) return;

        container.replaceChildren();

        if (!provas.length) {
            container.appendChild(
                criarElemento(
                    "p",
                    "muted",
                    "Você ainda não tem provas registradas."
                )
            );
            return;
        }

        provas.slice(0, 5).forEach(prova => {
            const card = criarElemento("article", "exam-card");

            const data = prova.date
                ? new Date(prova.date).toLocaleDateString("pt-BR")
                : "Data não registrada";

            card.append(
                criarElemento(
                    "h3",
                    "",
                    prova.stage
                        ? `Prova: ${prova.stage}`
                        : "Prova realizada"
                ),
                criarElemento(
                    "p",
                    "",
                    `${prova.correct || 0} de ${prova.total || 0} acertos`
                ),
                criarElemento(
                    "strong",
                    "",
                    `${Number(prova.pct) || 0}%`
                ),
                criarElemento("p", "muted", data)
            );

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

        const erros = obterErros(dados.history);

        texto("progress-answered", respondidas);
        texto("progress-accuracy", `${porcentagem}%`);
        texto(
            "progress-correct-count",
            `${acertos} ${acertos === 1 ? "acerto" : "acertos"}`
        );
        texto("progress-wrong", erros.length);

        renderizarMaterias(dados.history);
        renderizarErros(dados.history);
        renderizarProvas(dados.examHistory);
    }

    // Primeira atualização.
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            atualizarProgresso
        );
    } else {
        atualizarProgresso();
    }

    // Atualiza ao voltar para esta página.
    window.addEventListener("pageshow", atualizarProgresso);

    window.addEventListener("focus", atualizarProgresso);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) atualizarProgresso();
    });

    // Atualiza ao mudar de seção no StudyMind.
    document.addEventListener("click", evento => {
        if (!(evento.target instanceof Element)) return;

        const link = evento.target.closest(
            'a[href="#progresso"], a[href="#inicio"], ' +
            '[data-page="progresso"], [data-pagina="progresso"]'
        );

        if (link) {
            atualizarProgresso();
        }
    });

    window.addEventListener("hashchange", atualizarProgresso);

    // Atualiza quando outra aba modifica os dados.
    window.addEventListener("storage", evento => {
        if (evento.key === STORAGE_KEY || evento.key === null) {
            atualizarProgresso();
        }
    });

})();
