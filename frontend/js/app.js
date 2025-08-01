class TodoApp {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/todos';
        this.todos = [];
        this.currentFilter = 'all';
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadTodos();
    }
    
    bindEvents() {
        const addBtn = document.getElementById('addTodo');
        const titleInput = document.getElementById('todoTitle');
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        addBtn.addEventListener('click', () => this.addTodo());
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }
    
    async loadTodos() {
        try {
            this.showLoading();
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.todos = await response.json();
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showError('Ошибка при загрузке задач: ' + error.message);
        }
    }
    
    async addTodo() {
        const titleInput = document.getElementById('todoTitle');
        const descriptionInput = document.getElementById('todoDescription');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (!title) {
            this.showError('Введите название задачи');
            return;
        }
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const newTodo = await response.json();
            this.todos.unshift(newTodo);
            
            titleInput.value = '';
            descriptionInput.value = '';
            
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showError('Ошибка при добавлении задачи: ' + error.message);
        }
    }
    
    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !todo.completed })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const updatedTodo = await response.json();
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showError('Ошибка при обновлении задачи: ' + error.message);
        }
    }
    
    async deleteTodo(id) {
        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.todos = this.todos.filter(t => t.id !== id);
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showError('Ошибка при удалении задачи: ' + error.message);
        }
    }
    
    async editTodo(id, newTitle, newDescription) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    title: newTitle, 
                    description: newDescription 
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const updatedTodo = await response.json();
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.renderTodos();
        } catch (error) {
            this.showError('Ошибка при редактировании задачи: ' + error.message);
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }
    
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }
    
    renderTodos() {
        const todosList = document.getElementById('todosList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            todosList.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (this.currentFilter === 'completed') {
                emptyState.innerHTML = '<p>Нет выполненных задач</p>';
            } else if (this.currentFilter === 'pending') {
                emptyState.innerHTML = '<p>Нет активных задач</p>';
            } else {
                emptyState.innerHTML = '<p>Пока нет задач. Добавьте первую!</p>';
            }
            return;
        }
        
        todosList.style.display = 'block';
        emptyState.style.display = 'none';
        
        todosList.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
        
        filteredTodos.forEach(todo => {
            const checkbox = document.querySelector(`[data-todo-id="${todo.id}"] .todo-checkbox`);
            const editBtn = document.querySelector(`[data-todo-id="${todo.id}"] .btn-edit`);
            const deleteBtn = document.querySelector(`[data-todo-id="${todo.id}"] .btn-delete`);
            
            checkbox.addEventListener('click', () => this.toggleTodo(todo.id));
            editBtn.addEventListener('click', () => this.startEdit(todo.id));
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        });
    }
    
    createTodoHTML(todo) {
        const createdAt = new Date(todo.created_at).toLocaleString('ru-RU');
        const completedClass = todo.completed ? 'completed' : '';
        const checkedClass = todo.completed ? 'checked' : '';
        
        return `
            <div class="todo-item ${completedClass}" data-todo-id="${todo.id}">
                <div class="todo-header">
                    <div class="todo-checkbox ${checkedClass}"></div>
                    <div class="todo-content">
                        <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
                        ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}
                    </div>
                </div>
                <div class="todo-meta">
                    <span>Создано: ${createdAt}</span>
                    <div class="todo-actions">
                        <button class="btn-edit">Изменить</button>
                        <button class="btn-delete">Удалить</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    startEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const newTitle = prompt('Новое название:', todo.title);
        if (newTitle === null) return;
        
        const newDescription = prompt('Новое описание:', todo.description || '');
        if (newDescription === null) return;
        
        if (newTitle.trim()) {
            this.editTodo(id, newTitle.trim(), newDescription.trim());
        } else {
            this.showError('Название не может быть пустым');
        }
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTodos').textContent = `Всего: ${total}`;
        document.getElementById('completedTodos').textContent = `Выполнено: ${completed}`;
        document.getElementById('pendingTodos').textContent = `Активных: ${pending}`;
    }
    
    showLoading() {
        const todosList = document.getElementById('todosList');
        todosList.innerHTML = '<div class="loading">Загрузка...</div>';
    }
    
    showError(message) {
        const container = document.querySelector('.todos-container');
        const existingError = container.querySelector('.error');
        
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});