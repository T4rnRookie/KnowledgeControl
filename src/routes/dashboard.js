// src/routes/dashboard.js

const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { auth } = require('../middleware/auth'); // 假设 auth 中间件在这个文件中
function generateSnippet(content, keyword, snippetLength = 100) {
    if (!keyword) return content.slice(0, snippetLength) + '...';
    
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerContent.indexOf(lowerKeyword);
    if (index === -1) return content.slice(0, snippetLength) + '...';

    const start = Math.max(0, index - snippetLength / 2);
    const end = Math.min(content.length, index + keyword.length + snippetLength / 2);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
}
// 修复路由定义
router.get('/', auth, async (req, res) => {
    try {
        const search = req.query.search || '';
        let query = { author: req.user._id };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const documents = await Document.find(query).sort({ updatedAt: -1 });

        // 为每个文档生成包含搜索关键字的片段
        const documentsWithSnippets = documents.map(doc => ({
            ...doc.toObject(),
            snippet: generateSnippet(doc.content, search)
        }));

        res.render('dashboard', {
            user: req.user,
            documents: documentsWithSnippets,
            search: search
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { 
            message: 'An error occurred while loading the dashboard',
            user: req.user
        });
    }
});
module.exports = router;