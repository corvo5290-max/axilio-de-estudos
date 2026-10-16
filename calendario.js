
"use strict";

// ================================================
// ELEMENTOS DO HTML
// ================================================

const calendarGrid = document.getElementById("calendar-grid");
const monthTitle = document.getElementById("month-title");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const todayButton = document.getElementById("today-button");

// ================================================
// ESTADO DO CALENDÁRIO
// ================================================

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

// ================================================
// DATAS CONFIRMADAS
// ================================================

function carregarDiasConfirmados() {
  try {
    const dados = JSON.parse(
      localStorage.getItem("diasConfirmados") || "[]"
    );

    return new Set(Array.isArray(dados) ? dados : []);
  } catch (erro) {
    console.warn("Não foi possível carregar os dias confirmados:", erro);
    return new Set();
  }
}

// ================================================
// CRIAR CALENDÁRIO VISUAL
// ================================================

function criarCalendario() {
  if (!calendarGrid || !monthTitle) {
    console.error(
      "Calendário não encontrado. Confira os IDs calendar-grid e month-title no HTML."
    );
    return;
  }

  calendarGrid.replaceChildren();

  // Cabeçalho do mês.
  monthTitle.textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;

  const diasConfirmados = carregarDiasConfirmados();

  // Primeiro dia e quantidade de dias do mês.
  const primeiroDia = new Date(anoAtual, mesAtual, 1);
  const deslocamento = primeiroDia.getDay();

  const quantidadeDias = new Date(
    anoAtual,
    mesAtual + 1,
    0
  ).getDate();

  const fragmento = document.createDocumentFragment();

  // Espaços vazios antes do primeiro dia.
  // A ordem segue o HTML: domingo até sábado.
  for (let i = 0; i < deslocamento; i++) {
    const vazio = document.createElement("div");

    vazio.className = "calendar-day empty";
    vazio.setAttribute("aria-hidden", "true");

    fragmento.appendChild(vazio);
  }

  // Criar cada dia do mês.
  for (let numero = 1; numero <= quantidadeDias; numero++) {
    const data = new Date(anoAtual, mesAtual, numero);

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    const dataTexto = `${ano}-${mes}-${dia}`;

    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "calendar-day";
    botao.dataset.date = dataTexto;
    botao.setAttribute(
      "aria-label",
      `${numero} de ${nomesMeses[mesAtual]} de ${anoAtual}`
    );

    const numeroDia = document.createElement("span");
    numeroDia.className = "day-number";
    numeroDia.textContent = numero;

    botao.appendChild(numeroDia);

    // Destacar hoje.
    if (data.getTime() === hoje.getTime()) {
      botao.classList.add("today");
      botao.setAttribute("aria-current", "date");
    }

    // Destacar dias confirmados.
    if (diasConfirmados.has(dataTexto)) {
      botao.classList.add("complete");

      const estrela = document.createElement("span");
      estrela.className = "estrela-dia";
      estrela.textContent = "⭐";
      estrela.setAttribute("aria-hidden", "true");

      botao.appendChild(estrela);
    }

    fragmento.appendChild(botao);
  }

  // Inserir todos os dias de uma vez.
  calendarGrid.appendChild(fragmento);
}

// ================================================
// NAVEGAÇÃO ENTRE MESES
// ================================================

function mudarMes(diferenca) {
  const novaData = new Date(
    anoAtual,
    mesAtual + diferenca,
    1
  );

  mesAtual = novaData.getMonth();
  anoAtual = novaData.getFullYear();

  criarCalendario();
}

prevMonthButton?.addEventListener("click", () => {
  mudarMes(-1);
});

nextMonthButton?.addEventListener("click", () => {
  mudarMes(1);
});

// ================================================
// VOLTAR PARA O MÊS ATUAL
// ================================================

todayButton?.addEventListener("click", () => {
  mesAtual = hoje.getMonth();
  anoAtual = hoje.getFullYear();

  criarCalendario();
});

// ================================================
// ATUALIZAÇÃO QUANDO OUTRA ABA ALTERAR OS DADOS
// ================================================

window.addEventListener("storage", (evento) => {
  if (evento.key === "diasConfirmados") {
    criarCalendario();
  }
});

// ================================================
// INICIALIZAÇÃO
// ================================================

criarCalendario();
