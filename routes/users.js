const bcrypt = require('bcrypt');
const {connect} = require('../connect');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getUsers,
} = require('../controller/users');


const initAdminUser = async (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();
  }
  try{
    //Obtener la conexion con la base de datos
    const db = await connect();
    // Conecto a la coleccion user
    const collection = db.collection('users');
   //Busco por el email si existe ese administrador
    const adminUserExists = await collection.findOne({ email: adminEmail});
    //console.log(adminUserExists);
    //Chequear si el usuario existe en la coleccion de la base de datos
    if(!adminUserExists){
      //si no existe le asignamos las propiedades 
      const adminUser = {
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, 10),
        roles: "admin",
      };
      //Insertamos el usuario admin en la coleccion
      await collection.insertOne(adminUser);
      console.log('Usuario admin creado con exito');   
    }else{
      console.log('Usuario admin ya existe en la base de datos');
    }
  }catch(error){
    console.log(error);
  }
  

  /*const adminUser = {
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    roles: "admin",
  };*/

  // TODO: Create admin user
  // First, check if adminUser already exists in the database
  // If it doesn't exist, it needs to be saved

  next();
};

/*
 * Español:
 *
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la respuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta responder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la respuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, response y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una respuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la respuesta
 * (response).
 */

/*
 * Português Brasileiro:
 *
 * Fluxo de uma aplicação e requisição em node - express:
 *
 * request  -> middleware1 -> middleware2 -> rota
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * A essência é que a requisição passa por cada uma das funções intermediárias
 * ou "middlewares" até chegar à função da rota; em seguida, essa função gera a
 * resposta, que passa novamente por outras funções intermediárias até finalmente
 * responder à usuária.
 *
 * Um exemplo de middleware poderia ser uma função que verifica se uma usuária
 * está realmente registrada na aplicação e tem permissões para usar a rota. Ou
 * também um middleware de tradução, que altera a resposta dependendo do idioma
 * da usuária.
 *
 * É por isso que sempre veremos os argumentos request, response e next em nossos
 * middlewares e rotas. Cada uma dessas funções terá a oportunidade de acessar a
 * requisição (request) e cuidar de enviar uma resposta (quebrando a cadeia) ou
 * delegar a requisição para a próxima função na cadeia (invocando next). Dessa
 * forma, a requisição (request) passa através das funções, assim como a resposta
 * (response).
 */

module.exports = (app, next) => {

  app.get('/users', requireAdmin, getUsers);

  app.get('/users/:uid', requireAuth, (req, resp) => {
  });

  app.post('/users', requireAdmin, (req, resp, next) => {
    // TODO: Implement the route to add new users
  });

  app.put('/users/:uid', requireAuth, (req, resp, next) => {
  });

  app.delete('/users/:uid', requireAuth, (req, resp, next) => {
  });

  initAdminUser(app, next);
};
