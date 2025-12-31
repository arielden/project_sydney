#!/usr/bin/env node

/**
 * Simple database validation script
 * Tests if the schema and seed data are working correctly
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sidney_db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123'
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables found:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check categories
    const categories = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n📂 Categories: ${categories.rows[0].count}`);

    // Check questions
    const questions = await client.query('SELECT COUNT(*) as count FROM questions');
    console.log(`❓ Questions: ${questions.rows[0].count}`);

    // Check users
    const users = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users: ${users.rows[0].count}`);

    if (parseInt(questions.rows[0].count) > 0) {
      console.log('\n✅ Database setup looks good!');
      console.log('The quiz tests should now work.');
    } else {
      console.log('\n❌ No questions found. Seed data may not have loaded.');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Make sure PostgreSQL is running and the database exists.');
    console.log('You can start PostgreSQL with: sudo systemctl start postgresql');
    console.log('Or create the database manually.');
  } finally {
    await client.end();
  }
}

testDatabase();