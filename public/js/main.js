// public/js/main.js

// Login functionality
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

// Registration functionality
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful. Please log in.');
        window.location.href = '/auth/login';
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

// Dashboard functionality
const createDocumentForm = document.getElementById('create-document-form');
if (createDocumentForm) {
  createDocumentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const category = document.getElementById('category').value;
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
    try {
      const response = await fetch('/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, content, category, tags })
      });
      if (response.ok) {
        alert('Document created successfully');
        window.location.reload();
      } else {
        alert('Failed to create document');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

// Editor functionality
const editor = document.getElementById('editor');
if (editor) {
  // Initialize SimpleMDE editor
  const simplemde = new SimpleMDE({ element: editor });
  
  // Save document
  const saveButton = document.getElementById('save-document');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const content = simplemde.value();
      const documentId = editor.dataset.documentId;
      try {
        const response = await fetch(`/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content })
        });
        if (response.ok) {
          alert('Document saved successfully');
        } else {
          alert('Failed to save document');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }
}