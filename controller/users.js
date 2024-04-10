const { connect } = require ("../connect");
const bcrypt = require('bcrypt');
const { ObjectId } = require ("mongodb");

module.exports = {

  getUsers: async(req, resp) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
    try {
      //verifico que sea el admin
      /*if(req.user.roles !== 'admin'){
        return resp.status(403).json({error:'El usuario no es un administrador'});
      }*/
      const db= await connect();
      const collection = db.collection("users");
      const options = { projection: { password: 0 } };
      const { _limit, _page } = req.query;
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const offset = (page - 1) * limit;
      const findResults = await collection.find({}, options).skip(offset).limit(limit).toArray();
      return resp.status(200).json(findResults);
    
    } catch (error) {
       return resp.status(500).json({message: 'Error del servidor'});
    }
  },
  
  createUser: async(req, resp) =>{
    try{
      const { email, password, roles } = req.body;
      const db= await connect();
      const collection = db.collection("users");
      const rolesApi= ["admin", "waiter", "chef"];

      //Comprobar que el usuario ingrese los datos completos
      if(!email || !password){
        return resp.status(400).json({message:'Ingrese los datos completos'});
      }

      //Comprobar si el usuario ya esta registrado
      const existUser= await collection.findOne({email: email});
      console.log("usuario existente:", existUser);
      if(existUser){
        return resp.status(403).json({message:"El usuario ya se encuentra registrado"});
      }

      //Crear nuevo usuario
      const userData = {
        email: email,
        password: bcrypt.hashSync(password, 10),
        roles: roles,
      };
      const createNewUser= await collection.insertOne(userData);
      console.log('Nuevo usuario registrado:', createNewUser);
      return resp.status(200).json({message: "Usuario registrado con exito"});

    }
    catch(error){
      console.error(error)
      return resp.status(500).json({message: 'Error del servidor'});
    }
  }, 

  putUser: async(req, resp)=>{
    try{
      const { email, password, roles } = req.body;
      const { uid } = req.params;
      const options = { projection: { password: 0 } };

      //Conexion a la base de datos y a la coleccion users
      const db= await connect();
      const collection = db.collection("users");

      //Comprobar que el ID 
      const filter = validateIdAndEmail(uid);
      /*if(!filter){
        return resp.status(400).json({message:'ID no es valido'});
      }*/

      const user = await collection.findOne(filter, options);

      //Comprobar que es usuario exista en la bd
      if( user === null){
        return resp.status(404).json({message: 'El usuario no existe'});
      }

      //Comprobar si es admin
      if(req.roles !== 'admin'){
        return resp.status(403).json({message: 'El usuario no tiene permisos para actualizar informacion'})
      }


    }
    catch(error){
      console.error(error);
      return resp.status(500).json({message: 'Error del servidor'});
    }

  }
  
};

//Validar email y id

const validateIdAndEmail= (uid) => {
  let filter = null;
  const validateEmail= /^[\w.-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/;
  const validationId = ObjectId.isValid(uid);
  if (validateEmail.test(uid)) {
    filter = { email: uid };
  } else {
    if (validationId) {
      filter = { _id: new ObjectId(uid)};
    }
  }
  return filter;
};
