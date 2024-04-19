const jwt = require('jsonwebtoken');
const config = require('../config');
const bcrypt = require('bcrypt');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {

  app.post('/login', async (req, resp) => {
    
    try{
    // TODO: Authenticate the user
    // It is necessary to confirm if the email and password
      const { email, password } = req.body;
      if (!email || !password) {
        return resp.status(400).json({error: "Introduzca el email y password"});
      }
      //Conectar a la base de datos
      const db = await connect();
      const collection = db.collection('users');
      //Buscar si el usuario por su correo electronico
       // match a user in the database
      const user = await collection.findOne({email});

      //Enviar un error si no se encuentra el usuario
      if(!user){
        return resp.status(404).json({error: 'Usuario no encontrado'});
      }
      //Verificar si la contraseña coincide con la base de datos
      const compare = await bcrypt.compare(password, user.password);
      //console.log(password, user.password);
      
      //console.log('verifica', passwordMatch);
      if (compare){
        const {_id, roles } = user;
        const token = jwt.sign({ id: _id, 
          email: email, 
          roles: roles}, 
          secret);
      
        //Enviar el token en la respuesta     
        // If they match, send an access token created with JWT
        //Si las crendenciales son correctas, generar un token JWT
        return resp.status(200).json({token: token, user:{
          id: _id,
          email: email,
          roles: roles,
        },});
        
      }else{
          
          return resp.status(404).json({error: 'Contraseña incorrecta'});
      }
    
    } catch(error){
      console.log(error);
      resp.status(500).json({error: 'Error interno del servidor'});
    }
 

    //next();
  });

  return nextMain();
};
