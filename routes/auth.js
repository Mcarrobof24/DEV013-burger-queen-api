const jwt = require('jsonwebtoken');
const config = require('../config');
const bcrypt = require('bcrypt');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {

  app.post('/login', async (req, resp, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(400);
    }
    try{
    // TODO: Authenticate the user
    // It is necessary to confirm if the email and password
      //Conectar a la base de datos
      const db = await connect();
      const collection = db.collection('users');
      //Buscar si el usuario por su correo electronico
       // match a user in the database
      const user = await collection.findOne({email});

      //Enviar un error si no se encuentra el usuario
      if(!user){
        return resp.status(401).json({error: 'Usuario no encontrado'});
      }
      //Verificar si la contraseña coincide con la base de datos
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log(password, user.password);
      
      console.log('verifica', passwordMatch);
      if (!passwordMatch){
        return resp.status(401).json({error: 'Contraseña incorrecta'});
      }else{
          //Si las crendenciales son correctas, generar un token JWT
        const token = jwt.sign({ id: user._id, 
          email: user.email, 
          roles: user.role}, 
          secret, 
          {expiresIn: '1h'});
      
        //Enviar el token en la respuesta     
        // If they match, send an access token created with JWT
        resp.status(200).json({token});
      }
    
    } catch(error){
      console.log(error);
      resp.status(500).json({error: 'Error interno del servidor'});
    }
 
   


    //next();
  });

  return nextMain();
};
