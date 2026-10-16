
(() => {
    "use strict";

    // ==========================================
    // CONFIGURAÇÕES
    // ==========================================

    const STORAGE_KEY = "studymind_materiais_v1";
    const DB_NAME = "studymind_materiais_files";
    const STORE_NAME = "files";
    const DB_VERSION = 1;
    const MAX_FILE_SIZE = 15 * 1024 * 1024;

    const $ = (selector) => document.querySelector(selector);

    const form = $("#material-form");
    const titleInput = $("#material-title");
    const typeInput = $("#material-type");
    const subjectInput = $("#material-subject");
    const contentInput = $("#material-content");
    const fileInput = $("#material-file");
    const list = $("#materials-list");
    const emptyState = $("#empty-state");
    const status = $("#form-status");

    let materials = [];
    let databasePromise = null;

    // ==========================================
    // ARMAZENAMENTO DOS MATERIAIS
    // ==========================================

    function loadMaterials() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = JSON.parse(saved || "[]");

            materials = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Erro ao carregar materiais:", error);
            materials = [];
        }
    }

    function persistMaterials() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(materials)
        );
    }

    // ==========================================
    // BANCO DE ARQUIVOS
    // IndexedDB permite guardar arquivos Blob.
    // ==========================================

    function openDatabase() {
        if (databasePromise) {
            return databasePromise;
        }

        databasePromise = new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(
                    new Error(
                        "Seu navegador não suporta armazenamento de arquivos."
                    )
                );
                return;
            }

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });

        return databasePromise;
    }

    async function saveFile(id, file) {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).put({
                id,
                name: file.name,
                type: file.type,
                size: file.size,
                blob: file
            });

            transaction.oncomplete = resolve;
            transaction.onerror = () => {
                reject(transaction.error);
            };

            transaction.onabort = () => {
                reject(
                    transaction.error ||
                    new Error("O armazenamento foi cancelado.")
                );
            };
        });
    }

    async function getFile(id) {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_NAME,
                "readonly"
            );

            const request = transaction
                .objectStore(STORE_NAME)
                .get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function deleteFile(id) {
        try {
            const db = await openDatabase();

            await new Promise((resolve, reject) => {
                const transaction = db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

                transaction.objectStore(STORE_NAME).delete(id);

                transaction.oncomplete = resolve;
                transaction.onerror = () => {
                    reject(transaction.error);
                };
            });
        } catch (error) {
            console.error("Erro ao remover arquivo:", error);
        }
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    }

    function generateId() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
        );
    }

    function getTypeLabel(type) {
        const labels = {
            resumo: "Resumo",
            anotacao: "Anotação",
            arquivo: "Arquivo"
        };

        return labels[type] || "Material";
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Data desconhecida";
        }

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatSize(bytes) {
        if (!bytes) {
            return "Tamanho desconhecido";
        }

        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // ==========================================
    // ESTATÍSTICAS
    // ==========================================

    function updateStats() {
        $("#stat-total").textContent = materials.length;

        $("#stat-summaries").textContent =
            materials.filter(
                (material) => material.type === "resumo"
            ).length;

        $("#stat-notes").textContent =
            materials.filter(
                (material) => material.type === "anotacao"
            ).length;

        $("#stat-files").textContent =
            materials.filter(
                (material) =>
                    material.type === "arquivo" ||
                    Boolean(material.fileId)
            ).length;
    }

    // ==========================================
    // RENDERIZAÇÃO DA BIBLIOTECA
    // ==========================================

    function renderMaterials() {
        updateStats();

        const query = $("#search-materials")
            .value
            .trim()
            .toLocaleLowerCase("pt-BR");

        const filter = $("#filter-type").value;

        const filteredMaterials = materials
            .filter((material) => {
                const matchesType =
                    filter === "todos" ||
                    material.type === filter;

                const searchableText = [
                    material.title,
                    material.subject,
                    material.content,
                    material.fileName
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase("pt-BR");

                return (
                    matchesType &&
                    searchableText.includes(query)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a.updatedAt || a.createdAt
                ).getTime();

                const dateB = new Date(
                    b.updatedAt || b.createdAt
                ).getTime();

                return dateB - dateA;
            });

        list.replaceChildren();

        emptyState.classList.toggle(
            "hidden",
            filteredMaterials.length > 0
        );

        if (filteredMaterials.length === 0) {
            if (materials.length === 0) {
                emptyState.querySelector("h3").textContent =
                    "Sua biblioteca está vazia";

                emptyState.querySelector("p").textContent =
                    "Adicione seu primeiro resumo, anotação ou arquivo para começar.";
            } else {
                emptyState.querySelector("h3").textContent =
                    "Nenhum material encontrado";

                emptyState.querySelector("p").textContent =
                    "Tente mudar a busca ou o filtro selecionado.";
            }
        }

        filteredMaterials.forEach((material) => {
            const card = document.createElement("article");

            card.className = "material-card";

            card.innerHTML = `
                <div class="card-top">
                    <span class="type-pill ${escapeHTML(material.type)}">
                        ${escapeHTML(getTypeLabel(material.type))}
                    </span>

                    <div class="card-actions">
                        <button
                            type="button"
                            data-action="tutor"
                            data-id="${escapeHTML(material.id)}"
                            title="Estudar com o Tutor IA"
                        >Tutor IA</button>

                        <button
                            type="button"
                            data-action="edit"
                            data-id="${escapeHTML(material.id)}"
                        >Editar</button>

                        <button
                            type="button"
                            data-action="delete"
                            data-id="${escapeHTML(material.id)}"
                        >Excluir</button>
                    </div>
                </div>

                <h3>${escapeHTML(material.title)}</h3>

                ${
                    material.subject
                        ? `<p class="card-subject">
                            ${escapeHTML(material.subject)}
                           </p>`
                        : ""
                }

                <p class="card-content">${
                    escapeHTML(
                        material.content ||
                        (
                            material.fileName
                                ? "Arquivo anexado a este material."
                                : "Sem conteúdo escrito."
                        )
                    )
                }</p>

                ${
                    material.fileName
                        ? `<p class="card-file">
                            📎 ${escapeHTML(material.fileName)}
                            · ${formatSize(material.fileSize || 0)}
                            <button
                                type="button"
                                data-action="download"
                                data-id="${escapeHTML(material.id)}"
                            >Abrir/baixar</button>
                           </p>`
                        : ""
                }

                <p class="card-date">
                    Atualizado em ${escapeHTML(
                        formatDate(
                            material.updatedAt || material.createdAt
                        )
                    )}
                </p>
            `;

            list.appendChild(card);
        });
    }

    // ==========================================
    // FORMULÁRIO
    // ==========================================

    function resetForm() {
        form.reset();

        $("#material-id").value = "";

        $("#form-heading").textContent =
            "Criar material";

        $("#save-button").textContent =
            "Salvar material";

        $("#cancel-edit").classList.add("hidden");

        status.textContent = "";
    }

    function scrollToEditor() {
        $("#editor-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        titleInput.focus({
            preventScroll: true
        });
    }

    $("#new-material-button").addEventListener(
        "click",
        scrollToEditor
    );

    $("#empty-new-button").addEventListener(
        "click",
        scrollToEditor
    );

    $("#cancel-edit").addEventListener(
        "click",
        resetForm
    );

    $("#search-materials").addEventListener(
        "input",
        renderMaterials
    );

    $("#filter-type").addEventListener(
        "change",
        renderMaterials
    );

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        status.textContent = "";

        const existingId = $("#material-id").value;

        const existingMaterial = materials.find(
            (material) => material.id === existingId
        );

        const selectedFile = fileInput.files[0];

        if (!titleInput.value.trim()) {
            status.textContent =
                "Digite um título para o material.";

            titleInput.focus();
            return;
        }

        if (
            selectedFile &&
            selectedFile.size > MAX_FILE_SIZE
        ) {
            status.textContent =
                "O arquivo ultrapassa o limite de 15 MB.";

            return;
        }

        const id = existingId || generateId();

        let fileId = existingMaterial?.fileId || null;
        let fileName = existingMaterial?.fileName || "";
        let fileSize = existingMaterial?.fileSize || 0;

        try {
            if (selectedFile) {
                await saveFile(id, selectedFile);

                fileId = id;
                fileName = selectedFile.name;
                fileSize = selectedFile.size;
            }

            const now = new Date().toISOString();

            const material = {
                id,
                title: titleInput.value.trim(),
                type: typeInput.value,
                subject: subjectInput.value.trim(),
                content: contentInput.value.trim(),
                fileId,
                fileName,
                fileSize,
                createdAt:
                    existingMaterial?.createdAt || now,
                updatedAt: now
            };

            if (existingMaterial) {
                materials = materials.map((item) =>
                    item.id === id ? material : item
                );
            } else {
                materials.push(material);
            }

            persistMaterials();
            renderMaterials();
            resetForm();

            status.textContent = "Material salvo!";
        } catch (error) {
            console.error(error);

            status.textContent =
                error.message ||
                "Não foi possível salvar o material.";
        }
    });

    // ==========================================
    // AÇÕES DOS CARTÕES
    // ==========================================

    list.addEventListener("click", async (event) => {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const material = materials.find(
            (item) => item.id === button.dataset.id
        );

        if (!material) return;

        const action = button.dataset.action;

        // EDITAR
        if (action === "edit") {
            $("#material-id").value = material.id;

            titleInput.value = material.title;
            typeInput.value = material.type;
            subjectInput.value = material.subject || "";
            contentInput.value = material.content || "";

            // Não selecionamos novamente o arquivo antigo.
            fileInput.value = "";

            $("#form-heading").textContent =
                "Editar material";

            $("#save-button").textContent =
                "Salvar alterações";

            $("#cancel-edit").classList.remove("hidden");

            scrollToEditor();
        }

        // EXCLUIR
        else if (action === "delete") {
            const confirmed = confirm(
                `Deseja excluir "${material.title}"?`
            );

            if (!confirmed) return;

            materials = materials.filter(
                (item) => item.id !== material.id
            );

            persistMaterials();

            if (material.fileId) {
                await deleteFile(material.fileId);
            }

            renderMaterials();
        }

        // ABRIR OU BAIXAR ARQUIVO
        else if (action === "download") {
            try {
                const file = await getFile(
                    material.fileId || material.id
                );

                if (!file || !file.blob) {
                    throw new Error(
                        "Arquivo não encontrado neste navegador."
                    );
                }

                const url = URL.createObjectURL(file.blob);
                const anchor = document.createElement("a");

                anchor.href = url;
                anchor.download =
                    file.name ||
                    material.fileName ||
                    "material";

                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();

                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 60000);
            } catch (error) {
                alert(
                    error.message ||
                    "Não foi possível abrir o arquivo."
                );
            }
        }

        // TUTOR IA
        else if (action === "tutor") {
            const tutorPrompt = [
                "Quero estudar este material.",
                "Explique os pontos importantes de maneira clara.",
                "Depois, faça perguntas para verificar minha compreensão.",
                "",
                `Título: ${material.title}`,
                `Matéria: ${material.subject || "Não especificada"}`,
                `Tipo: ${getTypeLabel(material.type)}`,
                "",
                "Conteúdo:",
                material.content ||
                    "Não há texto escrito neste material.",
                "",
                material.fileName
                    ? `Arquivo anexado: ${material.fileName}. O arquivo não foi enviado automaticamente.`
                    : ""
            ]
                .filter(Boolean)
                .join("\n");

            try {
                await navigator.clipboard.writeText(tutorPrompt);

                alert(
                    "Pedido copiado! Cole o texto na conversa do Tutor IA."
                );
            } catch (error) {
                window.prompt(
                    "Copie o pedido abaixo e envie ao Tutor IA:",
                    tutorPrompt
                );
            }

            window.location.href = "index.html#tutor";
        }
    });

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    loadMaterials();
    renderMaterials();
})();
