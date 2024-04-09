const { connect } = require ("../connect");

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
};
