// src/app/db/db.js

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Definir __filename y __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura el Pool sin SSL, ya que el servidor no soporta conexiones SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||'postgres://neondb_owner:npg_BXPliJTQv14m@ep-royal-hat-a50vyfld-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require' ,
  ssl: false,
});

// Actualiza la ruta al archivo SQL: "init-db.sql"
const sqlFilePath = path.join(__dirname, 'init-db.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function run() {
  try {
    const result = await pool.query(sql);
    console.log('Script SQL ejecutado exitosamente:', result.rowCount);
  } catch (err) {
    console.error('Error ejecutando el script SQL:', err);
  } finally {
    await pool.end();
  }
}

run();
