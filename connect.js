const config = require('./config');
const {MongoClient} =require('mongodb');
//se pasa la url de la BD 
const client = new MongoClient(config.dbUrl);

// eslint-disable-next-line no-unused-vars
//const { dbUrl } = config;

async function connect() {
  // TODO: Database Connection
  try{
    //Conecta a MONGODB
    await client.connect();
    //Se coloca el nombre de la BD
    const db= client.db('burger_queen');
    console.log("conexion correcta");
    return db;

  } catch(error){
    console.log(error);
  }
}

module.exports = { connect };
