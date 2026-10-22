const pool = require('./src/config/database');

(async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles;');
    console.log('Conexión exitosa. Roles encontrados:');
    console.log(rows);
  } catch (error) {
    console.error('Error al conectar o consultar la base de datos:', error.message);
  } finally {
    await pool.end();
  }
})();
