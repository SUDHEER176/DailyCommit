import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'neetcode150.csv');
const raw = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV taking into account quotes
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  function splitLine(line) {
    const row = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  }

  const header = splitLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length < 4) continue;
    const item = {};
    header.forEach((h, idx) => {
      item[h] = values[idx] || '';
    });
    rows.push(item);
  }
  return { header, rows };
}

const { header, rows } = parseCSV(raw);
console.log('Header Columns:', header);
console.log('Total Parsed Questions:', rows.length);
console.log('Sample Row 0:', rows[0]);
console.log('Sample Row 10:', rows[10]);
console.log('Difficulties:', [...new Set(rows.map(r => r.Difficulty))]);
console.log('Topics:', [...new Set(rows.map(r => r.Topic))]);
