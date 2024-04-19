//Importa el modulo jsonwebtoken
const jwt = require('jsonwebtoken');

//Esta funcion es un middleware que se ejecuta en cada solicitud entrante.
module.exports = (secret) => (req, resp, next) => {

  //Se extrae del encabezado la autorizacion de la solicitud
  const { authorization } = req.headers;


  //Si no hay encabezado de autorizacion la funcion pasa al siguiente middleware
  if (!authorization) {
    return next();
  }

  //se divide el encabezado en type y token
  const [type, token] = authorization.split(' ');

  //si el type del token no es bearer pasa al siguiente middleware
  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  // Se verifica que el token JWT sea valido
  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      console.error("Error la verificar el token:", err);
      return next(403);
    }

    // TODO: Verify user identity using `decodeToken.uid`
    //guarda el id del user en req.user
    req.uid = decodedToken.id;
    req.roles = decodedToken.roles;
    req.email = decodedToken.email;
    next();
  });
};

//Esta funcion verifica si el usuario esta autenticado 
module.exports.isAuthenticated = (req) => {
  // TODO: Decide based on the request information whether the user is authenticated
  if(req.uid){
    return true;
  }else{
    return false;
  }
};

//Esta funcion verifica si el usuario es un administrador
module.exports.isAdmin = (req) => {
  // TODO: Decide based on the request information whether the user is an admin
  if(req.roles === 'admin'){
    return true;
  } else{
    return false;
  }
};

//Middleware se utiliza para requerir autenticacion en ciertas rutas de la API
module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

//Middleware se utiliza para requerir que el usuario sea un administrados en ciertas rutas de la API
module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
