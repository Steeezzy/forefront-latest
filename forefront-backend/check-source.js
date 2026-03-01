import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({connectionString: 'postgresql://postgres:password@localhost:5433/forefront'});
pool.query("SELECT id, status, error_message, url FROM knowledge_sources WHERE url LIKE '%sjcet%'")
    .then(r => {
        console.log(JSON.stringify(r.rows, null, 2));
        pool.end();
    })
    .catch(e => {
        console.error(e.message);
        pool.end();
    });
