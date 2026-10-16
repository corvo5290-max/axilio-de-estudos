
"use strict";

// ================================================
// ELEMENTOS DO HTML
// ================================================

const calendarGrid = document.getElementById("calendar-grid");
const monthTitle = document.getElementById("month-title");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const todayButton = document.getElementById("today-button");

const eventForm = document.getElementById("event-form");
const eventTitle = document.getElementById("event-title");
const eventDate = document.getElementById("event-date");
const eventTime = document.getElementById("event-time");
const eventType = document.getElementById("event-type");
const eventDescription = document.getElementById("event-description");

const cancelEditButton = document.getElementById("cancel-edit");
const selectedDateLabel = document.getElementById("selected-date-label");
const agendaDate = document.getElementById("agenda-date");
const eventCount = document.getElementById("event-count");
const eventFilter = document.getElementById("event-filter");
const eventList = document.getElementById("event-list");

// ================================================
// ESTADO
// ================================================

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

let dataSelecionada = formatarData(hoje);
let eventoEditandoId = null;

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

const nomesTipos = {
  study: "Estudo",
  reminder: "Lembrete",
  exam: "Prova"
};

// ================================================
// DATAS
// ================================================

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataBrasileira(dataTexto) {
  if (!dataTexto) return "";

  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
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
// ARMAZENAMENTO DOS EVENTOS
// ================================================

function obterEventos() {
  const eventos = lerJSON("eventos", []);
  return Array.isArray(eventos) ? eventos : [];
}

function salvarEventos(eventos) {
  try {
    localStorage.setItem("eventos", JSON.stringify(eventos));
    return true;
  } catch (erro) {
    console.error("Não foi possível salvar os eventos:", erro);
    alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

function obterDiasConfirmados() {
  const dias = lerJSON("diasConfirmados", []);
  return new Set(Array.isArray(dias) ? dias : []);
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ================================================
// SELEÇÃO DE DATA
// ================================================

function selecionarData(dataTexto) {
  dataSelecionada = dataTexto;

  const data = new Date(`${dataTexto}T12:00:00`);

  if (selectedDateLabel) {
    selectedDateLabel.textContent = formatarDataBrasileira(dataTexto);
  }

  if (agendaDate) {
    agendaDate.textContent = formatarDataBrasileira(dataTexto);
  }

  if (eventDate) {
    eventDate.value = dataTexto;
  }

  criarCalendario();
  renderizarAgenda();

  document.dispatchEvent(
    new CustomEvent("calendar:date-selected", {
      detail: { date: dataTexto }
    })
  );
}

// ================================================
// CALENDÁRIO VISUAL
// ================================================

function criarCalendario() {
  if (!calendarGrid || !monthTitle) return;

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

  // Espaços anteriores ao primeiro dia.
  for (let i = 0; i < deslocamento; i++) {
    const vazio = document.createElement("div");
    vazio.className = "day other-month";
    vazio.setAttribute("aria-hidden", "true");
    fragmento.appendChild(vazio);
  }

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
    }

    botao.setAttribute(
      "aria-pressed",
      String(dataTexto === dataSelecionada)
    );

    const numeroElemento = document.createElement("span");
    numeroElemento.className = "day-number";
    numeroElemento.textContent = numero;
    botao.appendChild(numeroElemento);

    // Pontinhos que representam os tipos de evento.
    const indicadores = document.createElement("span");
    indicadores.className = "day-dots";

    const eventosDoDia = eventos.filter(
      evento => evento && evento.date === dataTexto
    );

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

    if (diasConfirmados.has(dataTexto)) {
      botao.classList.add("complete");
      botao.title = "Dia confirmado";
    }

    botao.addEventListener("click", () => {
      selecionarData(dataTexto);
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

  selecionarData(formatarData(hoje));
});

// ================================================
// FORMULÁRIO: CRIAR E EDITAR EVENTOS
// ================================================

function limparFormulario() {
  if (!eventForm) return;

  eventForm.reset();
  eventoEditandoId = null;

  if (eventDate) {
    eventDate.value = dataSelecionada;
  }

  if (cancelEditButton) {
    cancelEditButton.hidden = true;
  }

  const botaoSalvar = document.getElementById("save-event");

  if (botaoSalvar) {
    botaoSalvar.textContent = "Salvar evento";
  }
}

function iniciarEdicao(evento) {
  if (!eventForm) return;

  eventoEditandoId = evento.id;

  if (eventTitle) eventTitle.value = evento.title || "";
  if (eventDate) eventDate.value = evento.date || dataSelecionada;
  if (eventTime) eventTime.value = evento.time || "";
  if (eventType) eventType.value = evento.type || "study";

  if (eventDescription) {
    eventDescription.value = evento.description || "";
  }

  if (cancelEditButton) {
    cancelEditButton.hidden = false;
  }

  const botaoSalvar = document.getElementById("save-event");

  if (botaoSalvar) {
    botaoSalvar.textContent = "Salvar alterações";
  }

  eventForm.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

eventForm?.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!eventTitle || !eventDate || !eventType) return;

  const titulo = eventTitle.value.trim();
  const data = eventDate.value;
  const tipo = eventType.value;

  if (!titulo || !data) {
    alert("Preencha o título e a data do evento.");
    return;
  }

  if (!["study", "reminder", "exam"].includes(tipo)) {
    alert("Selecione um tipo de evento válido.");
    return;
  }

  const eventos = obterEventos();

  const dados = {
    title: titulo,
    date: data,
    time: eventTime?.value || "",
    type: tipo,
    description: eventDescription?.value.trim() || ""
  };

  if (eventoEditandoId !== null) {
    const indice = eventos.findIndex(
      evento => evento.id === eventoEditandoId
    );

    if (indice === -1) {
      alert("Esse evento não foi encontrado. Tente novamente.");
      limparFormulario();
      return;
    }

    eventos[indice] = {
      ...eventos[indice],
      ...dados
    };
  } else {
    eventos.push({
      id: gerarId(),
      ...dados
    });
  }

  if (!salvarEventos(eventos)) return;

  dataSelecionada = data;

  const dataObjeto = new Date(`${data}T12:00:00`);
  mesAtual = dataObjeto.getMonth();
  anoAtual = dataObjeto.getFullYear();

  limparFormulario();
  selecionarData(data);
});

// Cancelar edição.
cancelEditButton?.addEventListener("click", () => {
  limparFormulario();
});

// ================================================
// EXCLUIR EVENTOS
// ================================================

function excluirEvento(id) {
  const eventos = obterEventos();
  const evento = eventos.find(item => item.id === id);

  if (!evento) return;

  if (!confirm(`Excluir o evento "${evento.title}"?`)) return;

  const atualizados = eventos.filter(item => item.id !== id);

  if (!salvarEventos(atualizados)) return;

  if (eventoEditandoId === id) {
    limparFormulario();
  }

  criarCalendario();
  renderizarAgenda();
}

// ================================================
// AGENDA: LISTAR E FILTRAR EVENTOS
// ================================================

function renderizarAgenda() {
  if (!eventList) return;

  eventList.replaceChildren();

  let eventos = obterEventos().filter(
    evento => evento && evento.date === dataSelecionada
  );

  const filtro = eventFilter?.value || "all";

  if (filtro !== "all") {
    eventos = eventos.filter(evento => evento.type === filtro);
  }

  // Ordenar por horário.
  eventos.sort((a, b) => {
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  });

  if (eventCount) {
    eventCount.textContent = String(eventos.length);
  }

  if (eventos.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "empty-events";
    vazio.textContent = "Nenhum evento para esta data.";
    eventList.appendChild(vazio);
    return;
  }

  eventos.forEach(evento => {
    const card = document.createElement("article");
    card.className = `event-card ${evento.type || "study"}`;

    const conteudo = document.createElement("div");
    conteudo.className = "event-content";

    const titulo = document.createElement("h3");
    titulo.className = "event-title";
    titulo.textContent = evento.title || "Evento sem título";
    conteudo.appendChild(titulo);

    const tipo = document.createElement("span");
    tipo.className = `event-type ${evento.type || "study"}`;
    tipo.textContent = nomesTipos[evento.type] || "Evento";
    conteudo.appendChild(tipo);

    if (evento.time) {
      const horario = document.createElement("p");
      horario.className = "event-time";
      horario.textContent = `Horário: ${evento.time}`;
      conteudo.appendChild(horario);
    }

    if (evento.description) {
      const descricao = document.createElement("p");
      descricao.className = "event-description";
      descricao.textContent = evento.description;
      conteudo.appendChild(descricao);
    }

    const acoes = document.createElement("div");
    acoes.className = "event-actions";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "edit-event";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => iniciarEdicao(evento));

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "delete-event";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", () => excluirEvento(evento.id));

    acoes.append(editar, excluir);
    card.append(conteudo, acoes);
    eventList.appendChild(card);
  });
}

eventFilter?.addEventListener("change", renderizarAgenda);

// ================================================
// ATUALIZAÇÃO ENTRE ABAS
// ================================================

window.addEventListener("storage", evento => {
  if (
    evento.key === "eventos" ||
    evento.key === "diasConfirmados"
  ) {
    criarCalendario();
    renderizarAgenda();
  }
});

// ================================================
// INICIALIZAÇÃO
// ================================================

if (eventDate) {
  eventDate.value = dataSelecionada;
}

if (selectedDateLabel) {
  selectedDateLabel.textContent =
    formatarDataBrasileira(dataSelecionada);
}

if (agendaDate) {
  agendaDate.textContent =
    formatarDataBrasileira(dataSelecionada);
}

if (cancelEditButton) {
  cancelEditButton.hidden = true;
}

criarCalendario();
renderizarAgenda();
