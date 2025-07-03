import { Pool } from 'pg';
import { db } from '../secrets';

console.log(db);

const pool = new Pool({
    host: db.host,
    port: db.port ? parseInt(db.port, 10) : undefined,
    user: db.user,
    password: db.password,
    database: db.name,
    max: db.maxPoolSize,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle unexpected errors
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Test connection once at startup
pool.connect()
    .then((client) => {
        console.log('✅ PostgreSQL connected successfully');
        client.release(); // release back to the pool
    })
    .catch((err) => {
        console.error('❌ PostgreSQL connection failed', err);
        process.exit(1);
    });

module.exports = pool;
