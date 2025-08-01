import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, Trash2, Edit3, User, LogOut, BarChart3 } from 'lucide-react';

// API функции
const API_BASE = 'http://localhost:3001/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Something went wrong');
    }
    
    return response.json();
  },

  auth: {
    register: function(userData) {
      return api.request('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    login: function(credentials) {
      return api.request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
  },

  todos: {
    getAll: function() {
      return api.request('/todos');
    },
    create: function(todo) {
      return api.request('/todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      });
    },
    update: function(id, todo) {
      return api.request(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(todo),
      });
    },
    delete: function(id) {
      return api.request(`/todos/${id}`, {
        method: 'DELETE',
      });
    },
  },

  stats: function() {
    return api.request('/stats');
  },
};

// Компонент авторизации
const AuthForm = function({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authFunction = isLogin ? api.auth.login : api.auth.register;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await authFunction(payload);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
              <input
                type="text"
                required={!isLogin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.username}
                onChange={function(e) {
                  setFormData({...formData, username: e.target.value});
                }}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.email}
              onChange={function(e) {
                setFormData({...formData, email: e.target.value});
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.password}
              onChange={function(e) {
                setFormData({...formData, password: e.target.value});
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={function() {
                setIsLogin(!isLogin);
              }}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'Нужен аккаунт? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент задачи
const TodoItem = function({ todo, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description);

  const handleSave = async function() {
    try {
      await onUpdate(todo.id, {
        title: editTitle,
        description: editDescription,
        priority: todo.priority,
        completed: todo.completed
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50'
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[todo.priority]} transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={function() {
            onUpdate(todo.id, { ...todo, completed: !todo.completed });
          }}
          className="mt-1 text-gray-500 hover:text-indigo-600"
        >
          {todo.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={function(e) {
                  setEditTitle(e.target.value);
                }}
                className="w-full px-2 py-1 border rounded text-sm"
              />
              <textarea
                value={editDescription}
                onChange={function(e) {
                  setEditDescription(e.target.value);
                }}
                className="w-full px-2 py-1 border rounded text-sm"
                rows="2"
                placeholder="Описание задачи..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Сохранить
                </button>
                <button
                  onClick={function() {
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                  {todo.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                  todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {todo.priority === 'high' ? 'Высокий' : 
                   todo.priority === 'medium' ? 'Средний' : 'Низкий'}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={function() {
                      setIsEditing(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={function() {
                      onDelete(todo.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Основное приложение
const TodoApp = function() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, highPriority: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [filter, setFilter] = useState('all');

  useEffect(function() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadTodos();
      loadStats();
    }
  }, []);

  const loadTodos = async function() {
    try {
      const data = await api.todos.getAll();
      setTodos(data);
    } catch (err) {
      console.error('Error loading todos:', err);
    }
  };

  const loadStats = async function() {
    try {
      const data = await api.stats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAddTodo = async function(e) {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      await api.todos.create(newTodo);
      setNewTodo({ title: '', description: '', priority: 'medium' });
      setShowAddForm(false);
      loadTodos();
      loadStats();
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const handleUpdateTodo = async function(id, updates) {
    try {
      await api.todos.update(id, updates);
      loadTodos();
      loadStats();
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const handleDeleteTodo = async function(id) {
    try {
      await api.todos.delete(id);
      loadTodos();
      loadStats();
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const handleLogout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTodos([]);
  };

  const filteredTodos = todos.filter(function(todo) {
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    return true;
  });

  if (!user) {
    return React.createElement(AuthForm, { onLogin: setUser });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Мои Задачи</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-5 h-5" />
              <span>{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Всего</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Выполнено</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <Circle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">В работе</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 bg-red-500 rounded-full"></span>
              <span className="text-sm text-gray-600">Важные</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.highPriority}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            {['all', 'pending', 'completed'].map(function(filterType) {
              return (
                <button
                  key={filterType}
                  onClick={function() {
                    setFilter(filterType);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === filterType
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filterType === 'all' ? 'Все' :
                   filterType === 'pending' ? 'В работе' : 'Выполненные'}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={function() {
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить задачу</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Новая задача</h3>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <input
                type="text"
                placeholder="Название задачи"
                value={newTodo.title}
                onChange={function(e) {
                  setNewTodo({...newTodo, title: e.target.value});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                placeholder="Описание задачи (необязательно)"
                value={newTodo.description}
                onChange={function(e) {
                  setNewTodo({...newTodo, description: e.target.value});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
              <select
                value={newTodo.priority}
                onChange={function(e) {
                  setNewTodo({...newTodo, priority: e.target.value});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Низкий приоритет</option>
                <option value="medium">Средний приоритет</option>
                <option value="high">Высокий приоритет</option>
              </select>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={function() {
                    setShowAddForm(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {filter === 'all' ? 'У вас пока нет задач' :
                 filter === 'pending' ? 'Нет задач в работе' : 'Нет выполненных задач'}
              </p>
            </div>
          ) : (
            filteredTodos.map(function(todo) {
              return React.createElement(TodoItem, {
                key: todo.id,
                todo: todo,
                onUpdate: handleUpdateTodo,
                onDelete: handleDeleteTodo
              });
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
