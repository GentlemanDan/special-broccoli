const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (в реальном проекте используйте базу данных)
let users = [];
let todos = [];
let userIdCounter = 1;
let todoIdCounter = 1;

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка существования пользователя
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const newUser = {
      id: userIdCounter++,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);

    // Создание токена
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Создание токена
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Получение всех задач пользователя
app.get('/api/todos', authenticateToken, (req, res) => {
  const userTodos = todos.filter(todo => todo.userId === req.user.userId);
  res.json(userTodos);
});

// Создание новой задачи
app.post('/api/todos', authenticateToken, (req, res) => {
  const { title, description, priority = 'medium' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo = {
    id: todoIdCounter++,
    userId: req.user.userId,
    title,
    description: description || '',
    priority,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Обновление задачи
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const todoId = parseInt(req.params.id);
  const { title, description, priority, completed } = req.body;

  const todoIndex = todos.findIndex(todo => 
    todo.id === todoId && todo.userId === req.user.userId
  );

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const updatedTodo = {
    ...todos[todoIndex],
    title: title !== undefined ? title : todos[todoIndex].title,
    description: description !== undefined ? description : todos[todoIndex].description,
    priority: priority !== undefined ? priority : todos[todoIndex].priority,
    completed: completed !== undefined ? completed : todos[todoIndex].completed,
    updatedAt: new Date()
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
});

// Удаление задачи
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const todoId = parseInt(req.params.id);
  const todoIndex = todos.findIndex(todo => 
    todo.id === todoId && todo.userId === req.user.userId
  );

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(todoIndex, 1);
  res.json({ message: 'Todo deleted successfully' });
});

// Получение статистики пользователя
app.get('/api/stats', authenticateToken, (req, res) => {
  const userTodos = todos.filter(todo => todo.userId === req.user.userId);
  
  const stats = {
    total: userTodos.length,
    completed: userTodos.filter(todo => todo.completed).length,
    pending: userTodos.filter(todo => !todo.completed).length,
    highPriority: userTodos.filter(todo => todo.priority === 'high').length
  };

  res.json(stats);
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('POST /api/register - Register new user');
  console.log('POST /api/login - Login user');
  console.log('GET /api/todos - Get user todos');
  console.log('POST /api/todos - Create new todo');
  console.log('PUT /api/todos/:id - Update todo');
  console.log('DELETE /api/todos/:id - Delete todo');
  console.log('GET /api/stats - Get user statistics');
});

module.exports = app;
