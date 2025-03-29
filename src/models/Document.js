// models/Document.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPasswordProtected: { type: Boolean, default: false },
  password: { type: String },
}, { timestamps: true });

DocumentSchema.pre('save', async function(next) {
  if (this.isPasswordProtected && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

DocumentSchema.methods.checkPassword = async function(password) {
  if (!this.isPasswordProtected) return true;
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Document', DocumentSchema);