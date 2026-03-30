const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL');

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schema);
  console.log('Schema created successfully');

  // Generate proper password hashes
  const hash = await bcrypt.hash('admin123', 10);

  // Insert users with proper hashes
  await connection.query('USE simsq');

  // Check if users already exist
  const [existing] = await connection.query('SELECT COUNT(*) as count FROM users');
  if (existing[0].count === 0) {
    await connection.query(
      `INSERT INTO users (nama, email, password, role) VALUES
       ('Administrator', 'admin@sekolahsq.com', ?, 'admin'),
       ('Petugas Sarpras', 'sarpras@sekolahsq.com', ?, 'sarpras'),
       ('Petugas Perpustakaan', 'perpus@sekolahsq.com', ?, 'perpus'),
       ('Kepala Sekolah', 'kepsek@sekolahsq.com', ?, 'kepala_sekolah')`,
      [hash, hash, hash, hash]
    );
    console.log('Users seeded (password: admin123)');

    // Run remaining seed data (skip user inserts)
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    // Remove user INSERT and USE statement, run remaining
    const lines = seed.split('\n');
    const filteredSql = lines.filter(l => !l.startsWith('INSERT INTO users') && !l.startsWith('USE simsq')).join('\n');
    await connection.query(filteredSql);
    console.log('Seed data inserted');
  } else {
    console.log('Data already exists, skipping seed');
  }

  await connection.end();
  console.log('Setup complete!');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
