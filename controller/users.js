const { connect } = require ("../connect");
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
      const createNewUser= await collection.insertOne(req.body);
      console.log('Nuevo usuario registrado:', createNewUser);
      return resp.status(200).json({message: "Usuario registrado con exito"});

    }
    catch(error){
      return resp.status(500).json({message: 'Error del servidor'});
    }
  }
  
};

//Validar el email
