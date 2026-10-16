
"use strict";

// ==================================
// ELEMENTOS
// ==================================

const grid = document.getElementById("calendar-grid");
const tituloMes = document.getElementById("month-title");

const anterior = document.getElementById("prev-month");
const proximo = document.getElementById("next-month");
const hojeBtn = document.getElementById("today-button");

const formulario = document.getElementById("event-form");
const tituloEvento = document.getElementById("event-title");
const dataEvento = document.getElementById("event-date");
const horaEvento = document.getElementById("event-time");
const tipoEvento = document.getElementById("event-type");
const descricaoEvento = document.getElementById("event-description");

const lista = document.getElementById("event-list");
const contador = document.getElementById("event-count");
const dataAgenda = document.getElementById("agenda-date");
const dataSelecionadaLabel = document.getElementById("selected-date-label");
const filtro = document.getElementById("event-filter");

// ==================================
// ESTADO
// ==================================

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

let mes = hoje.getMonth();
let ano = hoje.getFullYear();
let selecionada = formatarData(hoje);

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

const tipos = {
  study: "Estudo",
  reminder: "Lembrete",
  exam: "Prova"
};

// ==================================
// FUNÇÕES BÁSICAS
// ==================================

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataBR(texto) {
  if (!texto) return "";

  const [ano, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function lerEventos() {
  try {
    const dados = JSON.parse(localStorage.getItem("eventos") || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarEventos(eventos) {
  localStorage.setItem("eventos", JSON.stringify(eventos));
}

// ==================================
// DESENHAR CALENDÁRIO
// ==================================

function desenharCalendario() {
  if (!grid || !tituloMes) return;

  grid.replaceChildren();
  tituloMes.textContent = `${meses[mes]} ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const quantidadeDias = new Date(ano, mes + 1, 0).getDate();
  const eventos = lerEventos();

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.className = "day other-month";
    grid.appendChild(vazio);
  }

  for (let numero = 1; numero <= quantidadeDias; numero++) {
    const data = formatarData(new Date(ano, mes, numero));
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "day";
    botao.dataset.date = data;

    if (data === formatarData(hoje)) {
      botao.classList.add("today");
    }

    if (data === selecionada) {
      botao.classList.add("selected");
    }

    const numeroDia = document.createElement("span");
    numeroDia.className = "day-number";
    numeroDia.textContent = numero;
    botao.appendChild(numeroDia);

    const pontos = document.createElement("span");
    pontos.className = "day-dots";

    const eventosDoDia = eventos.filter(e => e.date === data);

    for (const tipo of ["study", "reminder", "exam"]) {
      if (eventosDoDia.some(e => e.type === tipo)) {
        const ponto = document.createElement("i");
        ponto.className = `dot ${tipo}`;
        pontos.appendChild(ponto);
      }
    }

    botao.appendChild(pontos);

    botao.addEventListener("click", () => {
      selecionada = data;

      if (dataEvento) dataEvento.value = data;
      atualizarData();
      desenharCalendario();
      desenharAgenda();
    });

    grid.appendChild(botao);
  }
}

// ==================================
// MOSTRAR EVENTOS
// ==================================

function desenharAgenda() {
  if (!lista) return;

  lista.replaceChildren();

  if (dataAgenda) dataAgenda.textContent = dataBR(selecionada);
  if (dataSelecionadaLabel) {
    dataSelecionadaLabel.textContent = dataBR(selecionada);
  }

  let eventos = lerEventos().filter(e => e.date === selecionada);

  if (filtro && filtro.value !== "all") {
    eventos = eventos.filter(e => e.type === filtro.value);
  }

  eventos.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  if (contador) contador.textContent = eventos.length;

  if (eventos.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.textContent = "Nenhum evento nesta data.";
    lista.appendChild(mensagem);
    return;
  }

  for (const evento of eventos) {
    const card = document.createElement("article");
    card.className = `event-card ${evento.type}`;

    const titulo = document.createElement("h3");
    titulo.textContent = evento.title;
    card.appendChild(titulo);

    const tipo = document.createElement("p");
    tipo.textContent = tipos[evento.type] || "Evento";
    card.appendChild(tipo);

    if (evento.time) {
      const hora = document.createElement("p");
      hora.textContent = `Horário: ${evento.time}`;
      card.appendChild(hora);
    }

    if (evento.description) {
      const descricao = document.createElement("p");
      descricao.textContent = evento.description;
      card.appendChild(descricao);
    }

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir";

    excluir.addEventListener("click", () => {
      const restantes = lerEventos().filter(e => e.id !== evento.id);
      salvarEventos(restantes);
      desenharCalendario();
      desenharAgenda();
    });

    card.appendChild(excluir);
    lista.appendChild(card);
  }
}

function atualizarData() {
  if (dataEvento) dataEvento.value = selecionada;
  if (dataAgenda) dataAgenda.textContent = dataBR(selecionada);
  if (dataSelecionadaLabel) {
    dataSelecionadaLabel.textContent = dataBR(selecionada);
  }
}

// ==================================
// ADICIONAR EVENTO
// ==================================

if (formulario) {
  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const titulo = tituloEvento.value.trim();
    const data = dataEvento.value;

    if (!titulo || !data) {
      alert("Preencha o título e a data.");
      return;
    }

    const eventos = lerEventos();

    eventos.push({
      id: `${Date.now()}-${Math.random()}`,
      title: titulo,
      date: data,
      time: horaEvento ? horaEvento.value : "",
      type: tipoEvento ? tipoEvento.value : "study",
      description: descricaoEvento ? descricaoEvento.value.trim() : ""
    });

    try {
      salvarEventos(eventos);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível salvar o evento.");
      return;
    }

    selecionada = data;

    const dataObjeto = new Date(`${data}T12:00:00`);
    mes = dataObjeto.getMonth();
    ano = dataObjeto.getFullYear();

    formulario.reset();
    atualizarData();
    desenharCalendario();
    desenharAgenda();
  });
}

// ==================================
// BOTÕES
// ==================================

anterior?.addEventListener("click", () => {
  mes--;
  if (mes < 0) {
    mes = 11;
    ano--;
  }
  desenharCalendario();
});

proximo?.addEventListener("click", () => {
  mes++;
  if (mes > 11) {
    mes = 0;
    ano++;
  }
  desenharCalendario();
});

hojeBtn?.addEventListener("click", () => {
  mes = hoje.getMonth();
  ano = hoje.getFullYear();
  selecionada = formatarData(hoje);

  atualizarData();
  desenharCalendario();
  desenharAgenda();
});

filtro?.addEventListener("change", desenharAgenda);

// ==================================
// INICIAR
// ==================================

atualizarData();
desenharCalendario();
desenharAgenda();
