const config = require('./config');
const {MongoClient} =require('mongodb');

const client = new MongoClient(config.dbUrl);

// eslint-disable-next-line no-unused-vars
//const { dbUrl } = config;

async function connect() {
  // TODO: Database Connection
  try{
    await client.connect();
    const db= client.db('Colegios');
    console.log("conexion correct")
    return db;

  } catch(error){
    console.log(error);
  }
}

module.exports = { connect };
