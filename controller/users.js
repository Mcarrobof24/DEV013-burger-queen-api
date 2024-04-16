const { connect } = require ("../connect");
const bcrypt = require('bcrypt');

const { ObjectId} = require ("mongodb");
const { isAdmin } = require("../middleware/auth");

//Comprobar correo electronico correcto el formato
const isValidEmail= (email)=>{
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


module.exports = {

  getUsers: async(req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
    try {
      //verifico que sea el admin
      /*if(req.user.roles !== 'admin'){
        return resp.status(403).json({error:'El usuario no es un administrador'});
      }*/
      const db= await connect();
      const collection = db.collection("users");
      //const collection = getCollection('users');
      const options = { projection: { password: 0 } };
      const { _limit, _page } = req.query;
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const offset = (page - 1) * limit;
      const findResults = await collection.find({}, options).skip(offset).limit(limit).toArray();
      return resp.status(200).json(findResults);
    
    } catch (error) {
       return resp.status(500).json({error: 'Error del servidor'});
    }
  },

  getUserById: async(req, resp, next) =>{
    try{
      const db = await connect();
      const collection = db.collection("users");
      const { uid } = req.params;

      // Comprobar si el usuario es admin
      if(!isAdmin(req)){
        return resp.status(403).json({error: "El usuario no tiene permisos para realizar esta tarea"});
      }
      
       
      //Verificar si el uid es un ObjectId Valido
      const valideId = ObjectId.isValid(uid) 
        ? {_id: new ObjectId(uid)} 
        : {email:uid}
      
      const findUser = await collection.findOne(valideId);
      if(!validateUserOrAdmin(req, uid)){
        return resp.status(403).json({error: 'El usuario no tiene permisos para ver esta información'});
      }

      if(!findUser){
        return resp.status(404).json({error: "El usuario solicitado no existe"});
      }
      return resp.status(200).json({ id: _id, email, roles});
    } catch(error) {
      return resp.status(500).json({message: 'Error del servidor'});
    }

  },
  
  createUser: async(req, resp) =>{
    //POST
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
        return resp.status(403).json({error:"El usuario ya se encuentra registrado"});
      }
      if (!isValidEmail(email)) {
        return resp.status(400).json({ error: "Correo electrónico inválido" });
      }
      // Verificar la fortaleza de la contraseña
      if (password.length < 5) {
        return resp.status(400).send("password: mínimo 8 caracteres");
      };

      //Crear nuevo usuario
      const userData = {
        email: email,
        password: bcrypt.hashSync(password, 10),
        roles: roles,
      };
      const createNewUser= await collection.insertOne(userData);
      console.log('Nuevo usuario registrado:', createNewUser);
      return resp.status(200).json({ 
        _id: createNewUser.insertedId, 
        email: email,
        roles: roles,
        message: "Usuario registrado con exito"});

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

  },
  
  deleteUsers: async (req, resp)=>{
    //DELETE
    try{
      const { uid } = req.params;
      //Conexion a la base de datos y a la coleccion users
      const db= await connect();
      const collection = db.collection("user");
      const filter = validateIdAndEmail(uid);

      
      if(!validateUserOrAdmin(req, uid)){
        return resp.status(403).json({error: 'El usuario no tiene permisos para ver esta información'});
      }
      if (!filter) {
        return resp
          .status(400)
          .json({ error: "El ID de usuario proporcionado no es válido" });
      }
      // Buscar el usuario en la base de datos
      const getUser = await collection.findOne(filter);
      if (!getUser) {
        return resp.status(404).json({ error: "El Id del usuario no existe" });
      }
      // Eliminar el usuario de la base de datos
      const cursor = await collection.deleteOne(getUser);

      return resp
        .status(200)
        .json({ message: "Usuario eliminado", usuario: cursor });


    } catch(error){
      return resp.status(500).send("Error en el servidor");
    }
  }
  
};

//Comprobar si es usuario o admin
const validateUserOrAdmin = (req, uid) => {
  if (req.roles !== "admin") {
    if (uid !== req.uid && uid !== req.email) {
      return false;
    }
  }
  return true;
};

//Validar email y id

const validateIdAndEmail= (uid) => {
  let filter = null;
  const validateEmail= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validationId = ObjectId.isValid(uid);
  if (validateEmail.test(uid)) {
    filter = { email: uid };
  } else {
    if (validationId) {
      filter = {_id: new ObjectId(uid)};
    }
  }
  return filter;
};


