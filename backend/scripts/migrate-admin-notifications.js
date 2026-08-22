require("dotenv").config();

const pool = require("../db");

(async()=>{
    try{

        await pool.query(`
            ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS
                admin_is_read BOOLEAN NOT NULL DEFAULT FALSE
        `);

        await pool.query(`
            ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS
                admin_is_dismissed BOOLEAN NOT NULL DEFAULT FALSE
        `);

        console.log(
            "SUCCESS: Production admin notification columns are ready."
        );

    }catch(error){

        console.error(
            "MIGRATION ERROR:",
            error
        );

        process.exitCode = 1;

    }finally{

        await pool.end();

    }
})();
