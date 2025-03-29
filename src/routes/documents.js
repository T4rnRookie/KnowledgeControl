// src/routes/documents.js
const express = require('express');
const Document = require('../models/Document');
const { auth, adminAuth } = require('../middleware/auth');
const { marked } = require('marked');
const path = require('path'); 
const router = express.Router();
const hljs = require('highlight.js');
const multer = require('multer');
marked.setOptions({
  highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value;
      } else {
          return hljs.highlightAuto(code).value;
      }
  },
});
const { JSDOM } = require('jsdom');
router.get('/new', auth, (req, res) => {
  res.render('new-document', { title: 'Create New Document' });
});
// Create a new document
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = new Document({
      title,
      content,
      author: req.user._id
    });
    await document.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(400).render('new-document', { 
      title: 'Create New Document',
      error: 'Error creating document. Please try again.'
    });
  }
});

// Get all documents for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ author: req.user._id });
    res.send(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, '../public/uploads/')
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
      res.json({ location: `/uploads/${req.file.filename}` });
  } else {
      res.status(400).json({ error: 'No file uploaded' });
  }
});
// Get a specific document
router.get('/:id', auth, async (req, res) => {
  try {
      const document = await Document.findById(req.params.id);
      if (!document) {
          return res.status(404).render('error', { message: 'Document not found' });
      }

      // 检查用户是否有权限查看文档
      const isAuthorized = document.author.equals(req.user._id) || 
                           (req.session.authorizedDocuments && 
                            req.session.authorizedDocuments.includes(document._id.toString()));

      if (document.isPasswordProtected && !isAuthorized) {
          return res.render('view-document', { 
              document: { title: document.title, _id: document._id, isPasswordProtected: true },
              isAuthorized: false
          });
      }

      const renderedContent = marked(document.content); // 使用 marked 或其他 Markdown 渲染器
      res.render('view-document', { 
          document, 
          renderedContent, 
          isAuthorized: true
      });
  } catch (error) {
      console.error('Error viewing document:', error);
      res.status(500).render('error', { message: 'Error loading document' });
  }
});

router.post('/:id/check-password', auth, async (req, res) => {
  try {
      const document = await Document.findById(req.params.id);
      if (!document) {
          return res.status(404).render('error', { message: 'Document not found' });
      }

      if (await document.checkPassword(req.body.password)) {
          if (!req.session.authorizedDocuments) {
              req.session.authorizedDocuments = [];
          }
          req.session.authorizedDocuments.push(document._id.toString());
          return res.redirect(`/documents/${document._id}`);
      } else {
          return res.render('view-document', {
              document: { title: document.title, _id: document._id, isPasswordProtected: true },
              isAuthorized: false,
              error: 'Incorrect password'
          });
      }
  } catch (error) {
      console.error('Error checking password:', error);
      res.status(500).render('error', { message: 'Error checking password' });
  }
});
router.get('/:id/edit', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, author: req.user._id });
    if (!document) {
      return res.status(404).render('error', { message: 'Document not found' });
    }
    res.render('edit-document', { title: 'Edit Document', document });
  } catch (error) {
    console.error('Error fetching document for edit:', error);
    res.status(500).render('error', { message: 'Error fetching document' });
  }
});

// Update a document
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, password, removePassword } = req.body;
    const document = await Document.findOne({ _id: req.params.id, author: req.user._id });

    if (!document) {
      return res.status(404).render('error', { message: 'Document not found' });
    }

    document.title = title;
    document.content = content;

    if (password) {
      document.isPasswordProtected = true;
      document.password = password;
    } else if (removePassword) {
      document.isPasswordProtected = false;
      document.password = undefined;
    }

    await document.save();
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).render('error', { message: 'Error updating document' });
  }
});

// Delete a document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!document) {
      return res.status(404).send();
    }
    res.send(document);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin route: Get all documents
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const documents = await Document.find({}).populate('author', 'username');
    res.send(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;