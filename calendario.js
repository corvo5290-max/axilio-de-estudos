
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
// ESTADO
// ================================================

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

let dataSelecionada = formatarData(hoje);

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ================================================
// UTILITÁRIOS DE DATA
// ================================================

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function lerJSON(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : padrao;
  } catch (erro) {
    console.warn(`Erro ao ler ${chave}:`, erro);
    return padrao;
  }
}

// ================================================
// EVENTOS
// ================================================

// Lê eventos salvos sem alterar nem apagar os dados.
function obterEventos() {
  const eventos = lerJSON("eventos", []);
  return Array.isArray(eventos) ? eventos : [];
}

function obterDiasConfirmados() {
  const dias = lerJSON("diasConfirmados", []);
  return new Set(Array.isArray(dias) ? dias : []);
}

// ================================================
// DESENHAR CALENDÁRIO
// ================================================

function criarCalendario() {
  if (!calendarGrid || !monthTitle) {
    console.error("Não encontrei #calendar-grid ou #month-title.");
    return;
  }

  calendarGrid.replaceChildren();
  monthTitle.textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;

  const eventos = obterEventos();
  const diasConfirmados = obterDiasConfirmados();

  const primeiroDia = new Date(anoAtual, mesAtual, 1);
  const deslocamento = primeiroDia.getDay();

  const quantidadeDias = new Date(
    anoAtual,
    mesAtual + 1,
    0
  ).getDate();

  const fragmento = document.createDocumentFragment();

  // Espaços antes do primeiro dia.
  for (let i = 0; i < deslocamento; i++) {
    const vazio = document.createElement("div");
    vazio.className = "day other-month";
    vazio.setAttribute("aria-hidden", "true");
    fragmento.appendChild(vazio);
  }

  // Criar os dias do mês.
  for (let numero = 1; numero <= quantidadeDias; numero++) {
    const data = new Date(anoAtual, mesAtual, numero);
    const dataTexto = formatarData(data);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "day";
    botao.dataset.date = dataTexto;

    botao.setAttribute(
      "aria-label",
      `${numero} de ${nomesMeses[mesAtual]} de ${anoAtual}`
    );

    if (data.getTime() === hoje.getTime()) {
      botao.classList.add("today");
      botao.setAttribute("aria-current", "date");
    }

    if (dataTexto === dataSelecionada) {
      botao.classList.add("selected");
      botao.setAttribute("aria-pressed", "true");
    } else {
      botao.setAttribute("aria-pressed", "false");
    }

    const numeroElemento = document.createElement("span");
    numeroElemento.className = "day-number";
    numeroElemento.textContent = numero;

    botao.appendChild(numeroElemento);

    // Indicadores coloridos de eventos.
    const indicadores = document.createElement("span");
    indicadores.className = "day-dots";

    const eventosDoDia = eventos.filter(evento => {
      return evento && evento.date === dataTexto;
    });

    const tiposMostrados = new Set();

    eventosDoDia.forEach(evento => {
      const tipo = ["study", "reminder", "exam"].includes(evento.type)
        ? evento.type
        : "study";

      if (tiposMostrados.has(tipo)) return;
      tiposMostrados.add(tipo);

      const ponto = document.createElement("i");
      ponto.className = `dot ${tipo}`;
      ponto.setAttribute("aria-hidden", "true");
      indicadores.appendChild(ponto);
    });

    botao.appendChild(indicadores);

    // Marca dias confirmados, se houver.
    if (diasConfirmados.has(dataTexto)) {
      botao.classList.add("complete");
      botao.title = "Dia confirmado";
    }

    botao.addEventListener("click", () => {
      dataSelecionada = dataTexto;

      const campoData = document.getElementById("event-date");
      const etiquetaData = document.getElementById("selected-date-label");
      const dataAgenda = document.getElementById("agenda-date");

      if (campoData) {
        campoData.value = dataTexto;
      }

      if (etiquetaData) {
        etiquetaData.textContent = data.toLocaleDateString("pt-BR");
      }

      if (dataAgenda) {
        dataAgenda.textContent = data.toLocaleDateString("pt-BR");
      }

      criarCalendario();

      // Avisa outros códigos da página sobre a seleção.
      document.dispatchEvent(
        new CustomEvent("calendar:date-selected", {
          detail: { date: dataTexto }
        })
      );
    });

    fragmento.appendChild(botao);
  }

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

prevMonthButton?.addEventListener("click", () => mudarMes(-1));
nextMonthButton?.addEventListener("click", () => mudarMes(1));

todayButton?.addEventListener("click", () => {
  mesAtual = hoje.getMonth();
  anoAtual = hoje.getFullYear();
  dataSelecionada = formatarData(hoje);

  criarCalendario();

  const campoData = document.getElementById("event-date");
  const etiquetaData = document.getElementById("selected-date-label");
  const dataAgenda = document.getElementById("agenda-date");

  if (campoData) campoData.value = dataSelecionada;

  if (etiquetaData) {
    etiquetaData.textContent = hoje.toLocaleDateString("pt-BR");
  }

  if (dataAgenda) {
    dataAgenda.textContent = hoje.toLocaleDateString("pt-BR");
  }

  document.dispatchEvent(
    new CustomEvent("calendar:date-selected", {
      detail: { date: dataSelecionada }
    })
  );
});

// ================================================
// ATUALIZAR AO ALTERAR DADOS EM OUTRA ABA
// ================================================

window.addEventListener("storage", evento => {
  if (evento.key === "eventos" || evento.key === "diasConfirmados") {
    criarCalendario();
  }
});

// ================================================
// INICIALIZAÇÃO
// ================================================

if (document.getElementById("event-date")) {
  document.getElementById("event-date").value = dataSelecionada;
}

if (document.getElementById("selected-date-label")) {
  document.getElementById("selected-date-label").textContent =
    hoje.toLocaleDateString("pt-BR");
}

if (document.getElementById("agenda-date")) {
  document.getElementById("agenda-date").textContent =
    hoje.toLocaleDateString("pt-BR");
}

criarCalendario();
