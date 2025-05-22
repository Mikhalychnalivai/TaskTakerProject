document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM загружен, инициализация приложения...");
    
    const elements = {
        taskListBtn: document.getElementById('taskListBtn'),
        taskPanel: document.getElementById('taskPanel'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        modalOverlay: document.getElementById('modalOverlay'),
        createTaskBtn: document.getElementById('createTaskBtn'),
        cancelTaskBtn: document.getElementById('cancelTaskBtn'),
        newTaskName: document.getElementById('newTaskName'),
        taskDescription: document.getElementById('taskDescription'),
        taskFile: document.getElementById('taskFile'),
        taskTags: document.getElementById('taskTags'),
        tasksList: document.getElementById('tasks'),
        taskInfoContent: document.querySelector('.task-info-content'),
        tagsCloud: document.getElementById('tagsCloud'),
        fileViewerModal: document.getElementById('fileViewerModal'),
        fileViewerFrame: document.getElementById('fileViewerFrame'),
        downloadFileBtn: document.getElementById('downloadFileBtn'),
        closeFileBtn: document.getElementById('closeFileBtn'),
        closeFileViewer: document.querySelector('.close-file-viewer'),
        resetFilterBtn: document.getElementById('resetFilterBtn')
    };

    const state = {
        tasks: [],
        selectedTaskIndex: null,
        isEditMode: false,
        currentEditTaskId: null,
        currentFile: null,
        currentFilter: null
    };

    // Функции работы с DOM
    function toggleTaskPanel() {
        elements.taskPanel.classList.toggle('show');
    }

    function openCreateModal() {
        state.isEditMode = false;
        state.currentEditTaskId = null;
        resetModalForm();
        elements.createTaskBtn.textContent = 'Создать';
        elements.modalOverlay.style.display = 'flex';
        elements.newTaskName.focus();
    }

    function openEditModal(index) {
        state.isEditMode = true;
        state.currentEditTaskId = index;
        const task = state.tasks[index];
        
        elements.newTaskName.value = task.name;
        elements.taskDescription.value = task.description || '';
        elements.taskTags.value = task.tags?.join(', ') || '';
        elements.createTaskBtn.textContent = 'Сохранить';
        
        elements.modalOverlay.style.display = 'flex';
        elements.newTaskName.focus();
    }

    function closeModal() {
        elements.modalOverlay.style.display = 'none';
        resetModalForm();
    }

    function resetModalForm() {
        elements.newTaskName.value = '';
        elements.taskDescription.value = '';
        elements.taskFile.value = '';
        elements.taskTags.value = '';
    }

    function closeFileViewer() {
        elements.fileViewerModal.style.display = 'none';
        elements.fileViewerFrame.src = '';
    }

    function showFile(file) {
        if (!file || !elements.fileViewerModal || !elements.fileViewerFrame) return;

        try {
            const fileURL = URL.createObjectURL(file);
            elements.fileViewerFrame.src = fileURL;
            elements.downloadFileBtn.href = fileURL;
            elements.downloadFileBtn.download = file.name;
            elements.fileViewerModal.style.display = 'flex';
            
            elements.fileViewerModal.addEventListener('hidden', () => {
                URL.revokeObjectURL(fileURL);
            }, { once: true });
        } catch (error) {
            console.error('Error showing file:', error);
            alert('Не удалось открыть файл');
        }
    }

    // Отображение списка задач
    function renderTasks() {
        elements.tasksList.innerHTML = "";
    
        const tasksToRender = state.currentFilter 
            ? state.tasks.filter(task => task.tags?.includes(state.currentFilter))
            : state.tasks;
    
        tasksToRender.forEach((task, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="task-name-container">
                    <span class="task-name">${task.name}</span>
                </div>
                ${task.tags ? `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}</div>` : ''}
            `;
            
            li.addEventListener("click", () => {
                selectTask(index);
            });
            
            elements.tasksList.appendChild(li);
        });
    }

    // Выбор задачи
    function selectTask(index) {
        state.selectedTaskIndex = index;
        showTaskDetails(index);
    }

    // Отображение деталей задачи
    function showTaskDetails(index) {
        const task = state.tasks[index];
        if (task) {
            elements.taskInfoContent.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.name}</h3>
                    <div class="task-actions">
                        <button class="edit-task-btn" data-task-id="${index}">Изменить</button>
                        <button class="delete-task-btn" data-task-id="${index}">Удалить</button>
                    </div>
                </div>
                <div class="task-description">
                    <h4>Описание:</h4>
                    <div class="description-text">${task.description || "Описание отсутствует"}</div>
                </div>
                <div class="task-files">
                    <h4>Прикрепленные файлы:</h4>
                    <div class="files-list">
                        ${task.file ? `
                            <div class="file-item" data-file-index="${index}">
                                <span class="file-icon">📄</span>
                                <span>${task.file.name}</span>
                            </div>
                        ` : '<div class="no-files">Файлы отсутствуют</div>'}
                    </div>
                </div>
                    
            `;

            // Обработчики для кнопок редактирования и удаления
            document.querySelector('.edit-task-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(index);
            });

            document.querySelector('.delete-task-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(index);
            });

            // Обработчик для файла
            if (task.file) {
                document.querySelector('.file-item')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.currentFile = task.file;
                    showFile(task.file);
                });
            }
        }
    }

    // Отображение облака тегов
    function renderTagsCloud() {
        const allTags = [...new Set(state.tasks.flatMap(task => task.tags || []))];
        elements.tagsCloud.innerHTML = allTags.map(tag => 
            `<span class="tag-filter ${state.currentFilter === tag ? 'active' : ''}" data-tag="${tag}">${tag}</span>`
        ).join('');
    
        document.querySelectorAll('.tag-filter').forEach(tag => {
            tag.addEventListener('click', () => {
                const selectedTag = tag.getAttribute('data-tag');
                state.currentFilter = state.currentFilter === selectedTag ? null : selectedTag;
                renderTagsCloud();
                renderTasks();
            });
        });
    }

    // Управление задачами
    function createTask(taskData) {
        state.tasks.push(taskData);
        renderTasks();
        renderTagsCloud();
        selectTask(state.tasks.length - 1);
    }

    function updateTask(index, taskData) {
        state.tasks[index] = taskData;
        renderTasks();
        renderTagsCloud();
        selectTask(index);
    }

    function deleteTask(index) {
        if (confirm('Удалить эту задачу?')) {
            state.tasks.splice(index, 1);
            renderTasks();
            renderTagsCloud();
            
            elements.taskInfoContent.innerHTML = `
                <div class="no-task-selected">
                    <p>Задача удалена. Выберите другую задачу.</p>
                </div>
            `;
        }
    }

    // Обработчики событий
    function handleTaskSubmit() {
        const name = elements.newTaskName.value.trim();
        const description = elements.taskDescription.value.trim();
        const file = elements.taskFile.files[0];
        const tags = elements.taskTags.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        if (!name) return;

        const taskData = {
            name,
            description,
            file,
            tags,
            completed: false
        };

        if (state.isEditMode && state.currentEditTaskId !== null) {
            updateTask(state.currentEditTaskId, taskData);
        } else {
            createTask(taskData);
        }

        closeModal();
    }

    function handleOverlayClick(e) {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    }

    function handleFileViewerClick(e) {
        if (e.target === elements.fileViewerModal) {
            closeFileViewer();
        }
    }

    function resetFilter() {
        state.currentFilter = null;
        renderTagsCloud();
        renderTasks();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        elements.taskListBtn.addEventListener('click', toggleTaskPanel);
        elements.addTaskBtn.addEventListener('click', openCreateModal);
        elements.cancelTaskBtn.addEventListener('click', closeModal);
        elements.createTaskBtn.addEventListener('click', handleTaskSubmit);
        elements.modalOverlay.addEventListener('click', handleOverlayClick);
        elements.closeFileBtn.addEventListener('click', closeFileViewer);
        elements.closeFileViewer.addEventListener('click', closeFileViewer);
        elements.fileViewerModal.addEventListener('click', handleFileViewerClick);
        elements.resetFilterBtn.addEventListener('click', resetFilter);
    }

    // Инициализация приложения
    function init() {
        setupEventListeners();
        renderTasks();
        renderTagsCloud();
    }

    // Запуск приложения
    init();
});