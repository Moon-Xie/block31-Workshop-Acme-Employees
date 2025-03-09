
/* import and initialize express app */
const express = require('express')
const pg = require('pg')
const employees = require("./db")
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/block31_employees')
const app = express()
const PORT = 3000;
/* this middleware deals with CORS errors and allows the client on port 5173 to access the server */
const cors = require('cors');
/* morgan is a logging library that allows us to see the requests being made to the server */
const morgan = require('morgan');

/* set up express middleware */
app.use(morgan('dev'));
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* set up intial hello world route */
app.get('/', (req, res) => [
  res.send('HEllO WORLD!')
])
/* set up api route */
app.get('/employees', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})



/* our middleware won't capture 404 errors, so we're setting up a separate error handler for those*/
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});
/* initialize server (listen) */
const init = async () => {
  await client.connect();
  console.log('database is connected!')
  console.log(employees)
  await client.query(/*sql*/`
    DROP TABLE IF EXISTS employees;
    CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      phone VARCHAR(30),
      isAdmin BOOLEAN DEFAULT FALSE
    );
  `);
  for(const employee of employees) {
    const SQL = /*sql*/`
        INSERT INTO employees(id, name, phone, isAdmin) 
        VALUES($1, $2, $3, $4)
      `;
      const values = [employee.id, employee.name, employee.phone, employee.isAdmin];
      await client.query(SQL, values);
  }
  app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`)
  })
}

init();