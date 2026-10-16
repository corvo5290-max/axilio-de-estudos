
"use strict";

(() => {
  const STORAGE_KEYS = [
    "studymind_calendar_events_v1",
    "eventos"
  ];

  const TYPES = ["study", "reminder", "exam"];

  const TYPE_NAMES = {
    study: "📚 Estudo",
    reminder: "🔔 Lembrete",
    exam: "📝 Prova ou trabalho"
  };

  const $ = id => document.getElementById(id);

  const monthTitle = $("month-title");
  const calendarGrid = $("calendar-grid");
  const selectedDateLabel = $("selected-date-label");
  const agendaDate = $("agenda-date");
  const eventCount = $("event-count");
  const eventList = $("event-list");
  const eventForm = $("event-form");

  const titleInput = $("event-title");
  const dateInput = $("event-date");
  const timeInput = $("event-time");
  const typeInput = $("event-type");
  const descriptionInput = $("event-description");

  const saveButton = $("save-event");
  const cancelEditButton = $("cancel-edit");
  const filterInput = $("event-filter");
  const formTitle = $("form-title");
  const formPanel = document.querySelector(".form-panel");

  const required = [
    ["month-title", monthTitle],
    ["calendar-grid", calendarGrid],
    ["event-form", eventForm],
    ["event-title", titleInput],
    ["event-date", dateInput],
    ["event-time", timeInput],
    ["event-type", typeInput],
    ["event-description", descriptionInput],
    ["event-list", eventList]
  ];

  const missing = required
    .filter(([, element]) => !element)
    .map(([id]) => id);

  if (missing.length) {
    console.error(
      "Calendário: elementos HTML ausentes:",
      missing
    );
    return;
  }

  const today = new Date();

  let displayedMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  let selectedDate = toDateKey(today);
  let editingId = null;
  let events = loadEvents();

  dateInput.value = selectedDate;

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function parseDate(key) {
    const [year, month, day] = key
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  function validDateKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key))) {
      return false;
    }

    const date = parseDate(key);

    return (
      !Number.isNaN(date.getTime()) &&
      toDateKey(date) === key
    );
  }

  function formatDate(key, includeWeekday = true) {
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric"
    };

    if (includeWeekday) {
      options.weekday = "long";
    }

    return parseDate(key).toLocaleDateString(
      "pt-BR",
      options
    );
  }

  function loadEvents() {
    const eventsById = new Map();

    for (const key of STORAGE_KEYS) {
      try {
        const saved = localStorage.getItem(key);

        if (!saved) continue;

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) continue;

        for (const item of parsed) {
          if (
            !item ||
            typeof item.title !== "string" ||
            !validDateKey(item.date)
          ) {
            continue;
          }

          const id = String(
            item.id ?? `${item.date}-${item.title}`
          );

          const normalized = {
            ...item,
            id,
            title: item.title.trim(),
            date: item.date,
            time: typeof item.time === "string"
              ? item.time
              : "",
            type: TYPES.includes(item.type)
              ? item.type
              : "study",
            description: typeof item.description === "string"
              ? item.description
              : "",
            completed: Boolean(item.completed),
            createdAt: item.createdAt || ""
          };

          if (!normalized.title) continue;

          // A chave antiga tem prioridade quando o ID se repete.
          if (
            !eventsById.has(id) ||
            key === STORAGE_KEYS[0]
          ) {
            eventsById.set(id, normalized);
          }
        }
      } catch (error) {
        console.error(
          `Erro ao carregar ${key}:`,
          error
        );
      }
    }

    return [...eventsById.values()];
  }

  function saveEvents() {
    try {
      const data = JSON.stringify(events);

      for (const key of STORAGE_KEYS) {
        localStorage.setItem(key, data);
      }

      return true;
    } catch (error) {
      console.error(
        "Erro ao salvar eventos:",
        error
      );

      alert(
        "Não consegui salvar os eventos. " +
        "Verifique o armazenamento do navegador."
      );

      return false;
    }
  }

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      `${Date.now()}-` +
      Math.random().toString(36).slice(2)
    );
  }

  function renderCalendar() {
    monthTitle.textContent =
      displayedMonth.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
      });

    calendarGrid.replaceChildren();

    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const firstWeekday = new Date(
      year,
      month,
      1
    ).getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const previousMonthDays = new Date(
      year,
      month,
      0
    ).getDate();

    const todayKey = toDateKey(today);

    // Seis semanas: 42 células.
    for (let cell = 0; cell < 42; cell++) {
      let date;
      let number;
      let otherMonth = false;

      if (cell < firstWeekday) {
        number =
          previousMonthDays - firstWeekday + cell + 1;

        date = new Date(
          year,
          month - 1,
          number
        );

        otherMonth = true;
      } else if (
        cell >= firstWeekday + daysInMonth
      ) {
        number =
          cell - firstWeekday - daysInMonth + 1;

        date = new Date(
          year,
          month + 1,
          number
        );

        otherMonth = true;
      } else {
        number = cell - firstWeekday + 1;

        date = new Date(
          year,
          month,
          number
        );
      }

      const key = toDateKey(date);

      const dayEvents = events.filter(
        event => event.date === key
      );

      const button = document.createElement("button");

      button.type = "button";
      button.className = "day";
      button.setAttribute(
        "aria-label",
        formatDate(key)
      );

      if (otherMonth) {
        button.classList.add("other-month");
      }

      if (key === todayKey) {
        button.classList.add("today");
      }

      if (key === selectedDate) {
        button.classList.add("selected");
      }

      button.setAttribute(
        "aria-pressed",
        String(key === selectedDate)
      );

      const numberSpan = document.createElement("span");
      numberSpan.className = "day-number";
      numberSpan.textContent = String(number);

      const dots = document.createElement("span");
      dots.className = "day-dots";

      const types = [
        ...new Set(dayEvents.map(event => event.type))
      ];

      types.forEach(type => {
        const dot = document.createElement("i");

        dot.className = `dot ${type}`;
        dot.setAttribute("aria-hidden", "true");

        dots.appendChild(dot);
      });

      button.append(numberSpan, dots);

      button.addEventListener("click", () => {
        if (editingId !== null) {
          resetForm();
        }

        selectedDate = key;
        dateInput.value = key;

        if (otherMonth) {
          displayedMonth = new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          );
        }

        renderAll();
      });

      calendarGrid.appendChild(button);
    }
  }

 
  function matchesFilter(event, filter) {
    if (filter === "pending") {
      return !event.completed;
    }

    if (filter === "completed") {
      return Boolean(event.completed);
    }

    if (TYPES.includes(filter)) {
      return event.type === filter;
    }

    return true;
  }

  function renderAgenda() {
    if (selectedDateLabel) {
      selectedDateLabel.textContent =
        formatDate(selectedDate);
    }

    if (agendaDate) {
      agendaDate.textContent =
        formatDate(selectedDate);
    }

    const dayEvents = events
      .filter(event => event.date === selectedDate)
      .sort((a, b) => {
        const timeA = a.time || "99:99";
        const timeB = b.time || "99:99";

        return (
          timeA.localeCompare(timeB) ||
          a.title.localeCompare(b.title, "pt-BR")
        );
      });

    if (eventCount) {
      eventCount.textContent =
        String(dayEvents.length);
    }

    eventList.replaceChildren();

    const filter = filterInput
      ? filterInput.value
      : "all";

    const visibleEvents = dayEvents.filter(
      event => matchesFilter(event, filter)
    );

    if (!visibleEvents.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      if (!dayEvents.length) {
        empty.textContent =
          "Nenhum evento para este dia ainda. " +
          "Que tal adicionar um?";
      } else if (filter === "pending") {
        empty.textContent =
          "Todos os eventos deste dia foram concluídos!";
      } else if (filter === "completed") {
        empty.textContent =
          "Nenhum evento concluído neste dia ainda.";
      } else {
        empty.textContent =
          "Nenhum evento corresponde a este filtro.";
      }

      eventList.appendChild(empty);
      return;
    }

    visibleEvents.forEach(event => {
      eventList.appendChild(createEventCard(event));
    });
  }

  function makeButton(label, className, handler) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);

    return button;
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

    time.textContent =
      `${event.time ? event.time + " · " : ""}` +
      `${TYPE_NAMES[event.type] || TYPE_NAMES.study}`;

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

    const completeButton = makeButton(
      event.completed ? "↩ Reabrir" : "✓ Concluir",
      "small-button",
      () => {
        const previous = event.completed;
        event.completed = !previous;

        if (saveEvents()) {
          renderAll();
        } else {
          event.completed = previous;
        }
      }
    );

    const editButton = makeButton(
      "✎ Editar",
      "small-button",
      () => startEditing(event)
    );

    const deleteButton = makeButton(
      "✕ Excluir",
      "small-button delete",
      () => {
        const confirmed = window.confirm(
          `Deseja excluir o evento "${event.title}"?`
        );

        if (!confirmed) return;

        const previousEvents = events;

        events = events.filter(
          item => item.id !== event.id
        );

        if (saveEvents()) {
          if (editingId === event.id) {
            resetForm();
          }

          renderAll();
        } else {
          events = previousEvents;
        }
      }
    );

    actions.append(
      completeButton,
      editButton,
      deleteButton
    );

    card.appendChild(actions);

    return card;
  }

  function startEditing(event) {
    editingId = event.id;

    titleInput.value = event.title;
    dateInput.value = event.date;
    timeInput.value = event.time || "";
    typeInput.value = event.type;
    descriptionInput.value =
      event.description || "";

    selectedDate = event.date;

    const date = parseDate(event.date);

    displayedMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );

    if (formTitle) {
      formTitle.textContent = "Editar evento";
    }

    if (saveButton) {
      saveButton.textContent = "Salvar alterações";
    }

    if (cancelEditButton) {
      cancelEditButton.classList.remove("hidden");
      cancelEditButton.hidden = false;
    }

    renderAll();

    titleInput.focus();

    if (formPanel) {
      formPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function resetForm() {
    editingId = null;

    eventForm.reset();
    dateInput.value = selectedDate;

    if (typeInput) {
      typeInput.value = "study";
    }

    if (formTitle) {
      formTitle.textContent = "Adicionar evento";
    }

    if (saveButton) {
      saveButton.textContent = "+ Adicionar evento";
    }

    if (cancelEditButton) {
      cancelEditButton.classList.add("hidden");
      cancelEditButton.hidden = true;
    }
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
    const description =
      descriptionInput.value.trim();

    if (!title || !validDateKey(date)) {
      alert(
        "Preencha um nome e uma data válida para o evento."
      );
      return;
    }

    if (!TYPES.includes(type)) {
      alert("Selecione uma categoria válida.");
      return;
    }

    const previousEvents = events;

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

    const parsed = parseDate(date);

    displayedMonth = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      1
    );

    resetForm();
    renderAll();
  });

  const previousButton = $("prev-month");

  if (previousButton) {
    previousButton.addEventListener("click", () => {
      displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() - 1,
        1
      );

      renderCalendar();
    });
  }

  const nextButton = $("next-month");

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + 1,
        1
      );

      renderCalendar();
    });
  }

  const todayButton = $("today-button");

  if (todayButton) {
    todayButton.addEventListener("click", () => {
      displayedMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      selectedDate = toDateKey(today);

      resetForm();
      renderAll();
    });
  }

  dateInput.addEventListener("change", () => {
    if (!validDateKey(dateInput.value)) {
      return;
    }

    selectedDate = dateInput.value;

    const date = parseDate(selectedDate);

    displayedMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );

    renderAll();
  });

  if (filterInput) {
    filterInput.addEventListener(
      "change",
      renderAgenda
    );
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", () => {
      resetForm();
      renderAll();
    });
  }

  // Sincroniza os dados existentes e desenha a página.
  if (events.length) {
    saveEvents();
  }

  renderAll();
})();
