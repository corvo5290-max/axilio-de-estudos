"use strict";

const STORAGE_KEY = "studymind_calendar_events_v1";

const monthTitle = document.getElementById("month-title");
const calendarGrid = document.getElementById("calendar-grid");
const selectedDateLabel = document.getElementById("selected-date-label");
const agendaDate = document.getElementById("agenda-date");
const eventCount = document.getElementById("event-count");
const eventList = document.getElementById("event-list");
const eventForm = document.getElementById("event-form");

const titleInput = document.getElementById("event-title");
const dateInput = document.getElementById("event-date");
const timeInput = document.getElementById("event-time");
const typeInput = document.getElementById("event-type");
const descriptionInput = document.getElementById("event-description");

const saveButton = document.getElementById("save-event");
const cancelEditButton = document.getElementById("cancel-edit");
const filterInput = document.getElementById("event-filter");

const today = new Date();

let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = toDateKey(today);
let editingId = null;
let events = loadEvents();

dateInput.value = selectedDate;

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateKey, includeWeekday = true) {
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  if (includeWeekday) {
    options.weekday = "long";
  }

  return parseDate(dateKey).toLocaleDateString("pt-BR", options);
}

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(event =>
      event &&
      typeof event.id === "string" &&
      typeof event.title === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
      ["study", "reminder", "exam"].includes(event.type)
    );
  } catch (error) {
    console.error("Não foi possível carregar os eventos:", error);
    return [];
  }
}

function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar os eventos:", error);

    alert(
      "Não consegui salvar os eventos no navegador. " +
      "Verifique se o armazenamento está disponível."
    );

    return false;
  }
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renderCalendar() {
  monthTitle.textContent = displayedMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  calendarGrid.replaceChildren();

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const startingWeekday = firstDay.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Completa a primeira semana com os últimos dias do mês anterior.
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  // Seis semanas garantem espaço para qualquer mês.
  for (let cell = 0; cell < 42; cell++) {
    let dayNumber;
    let cellDate;
    let isOtherMonth = false;

    if (cell < startingWeekday) {
      dayNumber = daysInPreviousMonth - startingWeekday + cell + 1;
      cellDate = new Date(year, month - 1, dayNumber);
      isOtherMonth = true;
    } else if (cell >= startingWeekday + daysInMonth) {
      dayNumber = cell - startingWeekday - daysInMonth + 1;
      cellDate = new Date(year, month + 1, dayNumber);
      isOtherMonth = true;
    } else {
      dayNumber = cell - startingWeekday + 1;
      cellDate = new Date(year, month, dayNumber);
    }

    const dateKey = toDateKey(cellDate);
    const dayEvents = events.filter(event => event.date === dateKey);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    button.setAttribute("aria-label", formatDate(dateKey));

    if (isOtherMonth) {
      button.classList.add("other-month");
    }

    if (dateKey === toDateKey(today)) {
      button.classList.add("today");
    }

    if (dateKey === selectedDate) {
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(dayNumber);

    const dots = document.createElement("span");
    dots.className = "day-dots";

    const types = [...new Set(dayEvents.map(event => event.type))];

    types.forEach(type => {
      const dot = document.createElement("i");
      dot.className = `dot ${type}`;
      dot.setAttribute("aria-hidden", "true");
      dots.appendChild(dot);
    });

    button.append(number, dots);

    button.addEventListener("click", () => {
      selectedDate = dateKey;

      if (isOtherMonth) {
        displayedMonth = new Date(
          cellDate.getFullYear(),
          cellDate.getMonth(),
          1
        );
      }

      if (editingId !== null) {
        resetForm();
      }

      dateInput.value = selectedDate;
      renderAll();
    });

    calendarGrid.appendChild(button);
  }
}

function renderAgenda() {
  selectedDateLabel.textContent = formatDate(selectedDate);
  agendaDate.textContent = formatDate(selectedDate);

  const dayEvents = events
    .filter(event => event.date === selectedDate)
    .sort((a, b) => {
      // Eventos com horário aparecem primeiro em ordem cronológica.
      const timeA = a.time || "99:99";
      const timeB = b.time || "99:99";

      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      return a.title.localeCompare(b.title, "pt-BR");
    });

  eventCount.textContent = String(dayEvents.length);
  eventList.replaceChildren();

  const filter = filterInput.value;

  const visibleEvents = dayEvents.filter(event => {
    if (filter === "pending") {
      return !event.completed;
    }

    if (filter === "completed") {
      return Boolean(event.completed);
    }

    return true;
  });

  if (visibleEvents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    if (dayEvents.length === 0) {
      empty.textContent =
        "Nenhum evento para este dia ainda. Que tal adicionar um?";
    } else if (filter === "pending") {
      empty.textContent = "Todos os eventos deste dia foram concluídos!";
    } else {
      empty.textContent = "Nenhum evento concluído neste dia ainda.";
    }

    eventList.appendChild(empty);
    return;
  }

  visibleEvents.forEach(event => {
    eventList.appendChild(createEventCard(event));
  });
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = `event-card type-${event.type}`;

  if (event.completed) {
    card.classList.add("completed");
  }

  const top = document.createElement("div");
  top.className = "event-card-top";

  const info = document.createElement("div");

  const title = document.createElement("div");
  title.className = "event-title";
  title.textContent = event.title;

  const time = document.createElement("div");
  time.className = "event-time";

  const typeNames = {
    study: "📚 Estudo",
    reminder: "🔔 Lembrete",
    exam: "📝 Prova ou trabalho"
  };

  time.textContent =
    `${event.time ? event.time + " · " : ""}${typeNames[event.type]}`;

  info.append(title, time);
  top.appendChild(info);
  card.appendChild(top);

  if (event.description) {
    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.description;
    card.appendChild(description);
  }

  const actions = document.createElement("div");
  actions.className = "event-actions";

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "small-button";
  completeButton.textContent = event.completed
    ? "↩ Reabrir"
    : "✓ Concluir";

  completeButton.addEventListener("click", () => {
    const previous = event.completed;
    event.completed = !previous;

    if (saveEvents()) {
      renderAll();
    } else {
      event.completed = previous;
    }
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "small-button";
  editButton.textContent = "✎ Editar";

  editButton.addEventListener("click", () => {
    startEditing(event);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "small-button delete";
  deleteButton.textContent = "✕ Excluir";

  deleteButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      `Deseja excluir o evento "${event.title}"?`
    );

    if (!confirmed) {
      return;
    }

    const previousEvents = events;
    events = events.filter(item => item.id !== event.id);

    if (saveEvents()) {
      if (editingId === event.id) {
        resetForm();
      }

      renderAll();
    } else {
      events = previousEvents;
    }
  });

  actions.append(completeButton, editButton, deleteButton);
  card.appendChild(actions);

  return card;
}

function startEditing(event) {
  editingId = event.id;

  titleInput.value = event.title;
  dateInput.value = event.date;
  timeInput.value = event.time || "";
  typeInput.value = event.type;
  descriptionInput.value = event.description || "";

  selectedDate = event.date;

  const parsedDate = parseDate(event.date);
  displayedMonth = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    1
  );

  document.getElementById("form-title").textContent = "Editar evento";
  saveButton.textContent = "Salvar alterações";
  cancelEditButton.classList.remove("hidden");

  renderAll();

  titleInput.focus();
  document.querySelector(".form-panel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function resetForm() {
  editingId = null;

  eventForm.reset();
  dateInput.value = selectedDate;

  document.getElementById("form-title").textContent = "Adicionar evento";
  saveButton.textContent = "+ Adicionar evento";
  cancelEditButton.classList.add("hidden");
}

function renderAll() {
  renderCalendar();
  renderAgenda();
}

eventForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  const type = typeInput.value;
  const description = descriptionInput.value.trim();

  if (!title || !date) {
    alert("Preencha o nome e a data do evento.");
    return;
  }

  if (!["study", "reminder", "exam"].includes(type)) {
    alert("Selecione uma categoria válida.");
    return;
  }

  const previousEvents = events;
  const previousSelectedDate = selectedDate;
  const previousDisplayedMonth = displayedMonth;

  if (editingId !== null) {
    events = events.map(item => {
      if (item.id !== editingId) {
        return item;
      }

      return {
        ...item,
        title,
        date,
        time,
        type,
        description
      };
    });
  } else {
    events.push({
      id: createId(),
      title,
      date,
      time,
      type,
      description,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  if (!saveEvents()) {
    events = previousEvents;
    return;
  }

  selectedDate = date;

  const parsedDate = parseDate(date);
  displayedMonth = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    1
  );

  resetForm();
  renderAll();
});

document.getElementById("prev-month").addEventListener("click", () => {
  displayedMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() - 1,
    1
  );

  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  displayedMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() + 1,
    1
  );

  renderCalendar();
});

document.getElementById("today-button").addEventListener("click", () => {
  displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedDate = toDateKey(today);

  resetForm();
  renderAll();
});

dateInput.addEventListener("change", () => {
  if (!dateInput.value) {
    return;
  }

  selectedDate = dateInput.value;

  const parsedDate = parseDate(selectedDate);
  displayedMonth = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    1
  );

  renderAll();
});

filterInput.addEventListener("change", renderAgenda);

cancelEditButton.addEventListener("click", () => {
  resetForm();
  renderAll();
});

renderAll();
