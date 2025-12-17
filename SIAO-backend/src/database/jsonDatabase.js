const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class JsonDatabase {
  constructor(dataDir = path.join(__dirname, '../data')) {
    this.dataDir = dataDir;
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  readCollection(collection) {
    const filePath = this.getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  writeCollection(collection, data) {
    const filePath = this.getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // CREATE
  create(collection, data) {
    const records = this.readCollection(collection);
    const newRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    this.writeCollection(collection, records);
    return newRecord;
  }

  // READ
  findAll(collection, filter = {}) {
    const records = this.readCollection(collection);
    if (Object.keys(filter).length === 0) return records;
    
    return records.filter(record => {
      return Object.keys(filter).every(key => record[key] === filter[key]);
    });
  }

  findById(collection, id) {
    const records = this.readCollection(collection);
    return records.find(record => record.id === id);
  }

  findOne(collection, filter) {
    const records = this.readCollection(collection);
    return records.find(record => {
      return Object.keys(filter).every(key => record[key] === filter[key]);
    });
  }

  // UPDATE
  update(collection, id, updates) {
    const records = this.readCollection(collection);
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) return null;
    
    records[index] = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.writeCollection(collection, records);
    return records[index];
  }

  // DELETE (soft delete - mantém histórico)
  delete(collection, id) {
    const records = this.readCollection(collection);
    const filtered = records.filter(record => record.id !== id);
    
    if (records.length === filtered.length) return false;
    
    this.writeCollection(collection, filtered);
    return true;
  }

  // COUNT
  count(collection, filter = {}) {
    return this.findAll(collection, filter).length;
  }

  // CLEAR (cuidado!)
  clear(collection) {
    this.writeCollection(collection, []);
  }
}

module.exports = new JsonDatabase();