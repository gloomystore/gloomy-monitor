import pool from './db';

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_down TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_urls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      program_id INT NOT NULL,
      url VARCHAR(1000) NOT NULL,
      last_status INT NULL,
      last_checked_at DATETIME NULL,
      last_error VARCHAR(500) NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE
    ) ENGINE=InnoDB
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY,
      interval_seconds INT NOT NULL DEFAULT 60
    ) ENGINE=InnoDB
  `);
  await pool.query('INSERT IGNORE INTO settings (id, interval_seconds) VALUES (1, 60)');
}
