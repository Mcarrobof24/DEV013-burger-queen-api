const { connect } = require ("../connect");
const bcrypt = require('bcrypt');

const { ObjectId } = require ("mongodb");
const { isAdmin } = require("../middleware/auth");


module.exports = {

  getUsers: async(req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table
    try {
      //Conectar la base de datos y la coleccion user
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
       resp.status(500).json({error: 'Error del servidor'});
       next(error);
    }
  },

  getUserById: async(req, resp, next) =>{

    //intento dos

    /*try{
      //Conectar la base de datos y la coleccion user
      const db = await connect();
      const collection = db.collection("users");
      const { uid } = req.params;
      const isValidObjectId = ObjectId.isValid(uid);

      // Comprobar si el usuario es admin
      if(!isAdmin(req)){
        return resp.status(403).json({error: "El usuario no tiene permisos para realizar esta tarea"});
      }

      /*let user;
      if(){

      }
      const findUser = await collection.findOne(isValidObjectId);
      if(!findUser){
        return resp.status(404).json({error: "El usuario solicitado no existe"});
      }



    } catch (error){
      resp.status(500).json({message: 'Error del servidor'});
      next(error);
    }*/

    //CODIGO ANTERIOR CON ERRORES
    try{
      const db = await connect();
      const collection = db.collection("users");
      const { uid } = req.params;
      //const isValidObjectId = ObjectId.isValid(uid);

      // Comprobar si el usuario es admin
      if(!isAdmin(req) && uid !== req.id && uid !== req.email){
        return resp.status(403).json({error: "El usuario no tiene permisos para realizar esta tarea"});
      }

      //Verificar si el uid es un ObjectId Valido
      const valideId = ObjectId.isValid(uid) 
        ? {_id: new ObjectId(uid)} 
        : {email:uid}
      
      const findUser = await collection.findOne(valideId);
      if(!findUser){
        return resp.status(404).json({error: "El usuario solicitado no existe"});
      }
      if(!validateUserOrAdmin(req, findUser._id.toString())){
        return resp.status(403).json({error: 'El usuario no tiene permisos para ver esta información'});
      }

     
      return resp.status(200).json({ id: findUser._id, email: findUser.email, roles: findUser.roles});
    } catch(error) {
      resp.status(500).json({message: 'Error del servidor'});
      next(error);
    }

  },
  
  createUser: async(req, resp, next) =>{
    //POST
    try{
      const { email, password, roles } = req.body;
      const db= await connect();
      const collection = db.collection("users");
      //const rolesApi= ["admin", "waiter", "chef"];

      //Comprobar que el usuario ingrese los datos completos
      if(!email || !password){
        return resp.status(400).json({message:'Ingrese los datos completos'});
      }

      //Comprobar si el usuario ya esta registrado
      const existUser= await collection.findOne({email: email});
      //console.log("usuario existente:", existUser);
      if(existUser){
        return resp.status(403).json({error:"El usuario ya se encuentra registrado"});
      }
      if (!isValidEmail(email)) {
        return resp.status(400).json({ error: "Correo electrónico inválido" });
      }
      // Verificar si es una contraseña segura
      if (password.length < 5) {
        return resp.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres"});
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
      resp.status(500).json({message: 'Error del servidor'});
      next(error);
    }
  }, 

  putUser: async(req, resp)=>{
    try{
      const { email, password, roles } = req.body;
      const { uid } = req.params;
      const isValidObjectId = ObjectId.isValid(uid)

      //Conexion a la base de datos y a la coleccion users
      const db= await connect();
      const collection = db.collection("users");

      // Comprobar si el usuario es admin
      if(!isAdmin(req) && uid !== req.id && uid !== req.email){
        return resp.status(403).json({error: "El usuario no tiene permisos para realizar esta tarea"});
      }

      //Verificar si tiene un ID valido
      let userPut;
      
      if (isValidEmail(uid)) {
        userPut = { email: uid };
      } 
      else if (isValidObjectId) {
        userPut = { _id: new ObjectId(uid)};
      }else {
        return resp.status(400).json({ error: "ID de usuario no es válido" });
      }
      
      const userUpdate = await collection.findOne(userPut);

      //Comprobar que es usuario exista en la bd
      if( !userUpdate){
        return resp.status(404).json({message: 'El usuario no existe'});
      }

      
      if (!email && !password && !roles) {
        return resp.status(400).json({error: " Por favor ingresar los campos completos para actualizar: email, contraseña, roles",});
      } 
      if (!isAdmin(req) && roles) {
        return resp.status(403).json({message:"No tiene permisos"})
      }
      //Actualiza los datos
      const dataUpdate = {};
      if(email){
        dataUpdate.email = email;
      }
      if(password){
        const hashPassword = bcrypt.hashSync(password, 10);
        dataUpdate.password = hashPassword;
      }
      if(roles){
        dataUpdate.roles= roles;
      }
      const dataUpdateCollection = await collection.updateOne(userPut, {$set: dataUpdate});
      return resp.status(200).json({message: "Información del usuario actualizada de manera exitosa", data: dataUpdateCollection});
    }
    catch(error){
      console.error(error);
      resp.status(500).json({message: 'Error del servidor'});
    }

  },
  
  deleteUsers: async (req, resp, next)=>{
    //DELETE
    try {
      //Conexion a la base de datos y a la coleccion users
      const db = await connect();
      const collection = db.collection("users");
      const { uid } = req.params;
      const isValidObjectId = ObjectId.isValid(uid);
      console.log("esto es el isvalidobjectId", isValidObjectId);

      //Verificar si el usuario tiene los permiso para realizar borrar
      if (!isAdmin(req)) {
        return resp.status(403).json({error:"El usuario no tiene permisos para realizar esta tarea"});
      }

      //Verificar si tiene un ID valido
      let user;
      if (isValidObjectId) {
        user = { _id: new ObjectId(uid)};
        console.log("este es el unser de object", user);
      } else if (isValidEmail(uid)) {
        user = { email: uid };
      } else {
        return resp.status(400).json({ error: "ID de usuario inválido" });
      }

      //Encontrar el usuario a eliminar
      const deleteUser = await collection.findOne(user); 

      // Verificar si existe el usuario solicitado en la base de datos
      if (!deleteUser) {
        return resp.status(404).json({ error: "El Id del usuario no existe" });
      }

      //Se elimina el usuario de la base de datos
      const deleted = await collection.deleteOne(deleteUser);
      resp.status(200).json({ message: "Usuario eliminado exitosamente", userDeleted: deleted });

    } catch (error) {
      resp.status(500).json({message: 'Error del servidor'});
      next(error);
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
//Verificar si el correo electronico tiene un formato correcto
const isValidEmail= (email)=>{
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


