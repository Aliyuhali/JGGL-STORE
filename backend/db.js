const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL
    })
    : new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || undefined
    });

pool.on("error", function(error){
    console.error(
        "Unexpected PostgreSQL error:",
        error
    );
});

module.exports = pool;
