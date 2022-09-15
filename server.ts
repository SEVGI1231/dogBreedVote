import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", async (req, res) => {
  try {
  const tenHighestVoted = await client.query('select * from dog_breeds order by votes desc limit 10');
  res.json(tenHighestVoted.rows);}
  catch(error) {
    res.status(500).send('Sorry, error.')
    console.error(error)
  }
});
app.get("/:number", async(req, res)=>{
  try{
    const {rowNumber}= req.params;
    const nthDog = await client.query('select * from dog_breeds order by votes desc limit 1 offset $1', [rowNumber]);
    res.json(nthDog.rows)
  }
  catch(error){
    res.status(500).send('Sorry, error.')
    console.error(error)
  }
})

app.post("/", async (req, res) =>  {
  try { 
    const {breedName}= req.body 
    const addVote = await client.query(
    `INSERT INTO dog_breeds(breed_name, votes) 
    VALUES ($1, 1)
    ON CONFLICT (breed_name)
    DO UPDATE SET votes = dog_breeds.votes + 1`,[breedName]);
    res.json(addVote.rows)
  }
  catch(error) {
    res.status(500).send('Sorry, error.')
    console.error(error)
  }

});
// `DO
// $do$
// BEGIN
//    IF EXISTS (SELECT * FROM dog_breeds WHERE breed_name=$1) THEN 
//        UPDATE dog_breeds SET votes = votes + 1 WHERE breed_name=$1;
//     ELSE
//       INSERT INTO dog_breeds (breed_name, votes) VALUES ($1, 1);
//     END IF;
//     END
//     $do$`, [breedName]);

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
