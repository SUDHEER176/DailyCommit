import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseNeetCodeQuestions } from './scheduler-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'neetcode150.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');
const questions = parseNeetCodeQuestions(csvText);

const backendJson = path.join(__dirname, 'neetcode150.json');
const frontendDataDir = path.join(__dirname, '../../frontend/src/data');
if (!fs.existsSync(frontendDataDir)) {
  fs.mkdirSync(frontendDataDir, { recursive: true });
}
const frontendJson = path.join(frontendDataDir, 'neetcode150.json');

fs.writeFileSync(backendJson, JSON.stringify(questions, null, 2), 'utf-8');
fs.writeFileSync(frontendJson, JSON.stringify(questions, null, 2), 'utf-8');

console.log(`Successfully generated neetcode150.json with ${questions.length} questions in backend and frontend!`);
