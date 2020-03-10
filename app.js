var express = require('express'); /*importamos express */
var app = express();
var mongoose = require('mongoose');
var hbs = require('express-handlebars');
var session = require('express-session');
var cors = require('cors');

/* es un middlewar, se va a llamar antes de llamar a mi codigo. Es para el maejo de session. Con esto puedo identificar al usuario (con la session) */
app.use(session({secret: 'ddfdfdffd'}));

mongoose.Promise = global.Promise;  /* para poder utilizar el async await sin problemas */

app.engine('handlebars', hbs()); /* definimos que utilizamos lo de arriba de handlebars, arriba solo lo importamos */
app.set('view engine', 'handlebars'); /* definimos que utilizamos lo de arriba de handlebars, arriba solo lo importamos */

app.use(cors());

/*para conectarse con la base de datos, retorna una promise o se puede hacer con async await. Conectamos con mongoose*/
async function conectar() {
    await mongoose.connect(
    'mongodb://10.128.35.136:27017/curso', /* es el numero de puerto, va siempre ese. Si es mi compu pongo localhost, asi le indico donde esta mongodb */
    {useNewUrlParser: true}
    )
    console.log('Conectado');
}

conectar();   /*aca se ejecuta el codigo conectar, porque aca la estoy llamando */

/* Con promise - then
mongoose.connect(
    'mongodb://10.5.20.78:27017',
    {useNewUrlParser: true}
).then(function(){
console.log('Conectado');
});

*/

/* definimos la estructura de datos de la que estamos hablando, que se guarda en la base de datos */
const ArtistaSchema = mongoose.Schema({
 nombre: String,
 apellido: String
})

/* El ArtistaModel se basa en el ArtistaSchema, en el codigo solo se trabaja con el Model. Artista seria el nombre de la coleccion. Aca estamos definiendo que es un modelo de mongoose. Le digo que la coleccion se va a llamar Artista, no hace falta que coicnida ese nombre "Artista" con el de ArtistaSchema */
const ArtistaModel = mongoose.model('Artista',
ArtistaSchema);


 /* Le digo que me traiga todo lo que tenga en Artista, me trae todo */
/*
app.get('/', async function(req,res){
    var listado = await ArtistaModel.find();  
    /*res.send('Hola mundo');*/
 /*   res.send(listado)
});
*/

app.get('/listado', async function(req,res){
    if (!req.session.user_id){     /* si la persona no esta logueada o si no encuentra ese user_id lo mando a la pantalla de login*/
        res.redirect('/login');
        return;
    }
    var abc = await ArtistaModel.find().lean();  
    res.render('listado', {listado: abc});
});


app.use(express.urlencoded({extended:true}));    /* para poder recibir bien la informacion cuando viene de un formulario */
app.use(express.json());   /* procesa lo que viene del navegador hacia express, convierte en un json lo que escribe en Nombre en req.body.nombre*/

/* busca en la carpeta views el formulario de handlebars*/
app.get('/alta', function(req,res){
        res.render('formulario');
});


/* recibe la info que se envio en el formulario, en la funcion anterior. La info la recibimos en req.body.nombre y req.body.apellido */
app.post('/alta', async function(req,res){
    if(req.body.nombre ==''){
        res.render('formulario', {
            error: 'El nombre es obligatorio', 
            datos: {
                nombre: req.body.nombre,
                apellido: req.body.apellido
            }
        });
        return;     /* lo ponemos para que haga un render y no ejecute el codigo de abajo*/
    }
    await ArtistaModel.create({
        nombre: req.body.nombre,   
        apellido: req.body.apellido
         });
    res.redirect('/listado');   /* aca se redirecciona a listado, una vez que envia el usuario los datos. El servidor hace un get a /listado */
    });

/* :id se transforma para utilizarlo dentro de la funcion, en req.params.id */
app.get('/borrar/:id', async function(req,res){
    var rta = await ArtistaModel.findByIdAndRemove(
    {_id: req.params.id}
    );
 /* res.send(rta); */
    res.redirect('/listado');
});

/* poner siempre el .lean() para que se vean los datos, solo va en app.get*/
app.get('/editar/:id', async function (req, res){
        var artista = await ArtistaModel.findById({
        _id: req.params.id}).lean();
        res.render('formulario', {datos: artista});
        
});

app.post('/editar/:id', async function(req,res){
    if(req.body.nombre ==''){
        res.render('formulario', {
            error: 'El nombre es obligatorio', 
            datos: {
                nombre: req.body.nombre,
                apellido: req.body.apellido
            }
        });
        return;     /* lo ponemos para que haga un render y no ejecute el codigo de abajo*/
    }
    await ArtistaModel.findeByIdAndUpdate(
    {_id: req.params.id},
    {
        nombre: req.body.nombre,
        apellido: req.body.apellido
    });
    res.redirect('/listado');
});


/* para traer al artista cuyo id me paso en el url, el id de las llaves tiene que ser el mismo que el de la url */
app.get('/buscar/:id', async function(req,res){
    var listado = await ArtistaModel.find( {_id: req.params.id}) 
    res.send(listado);
});


/* en la funcion trae todos los artistas y puedo filtrar */
app.get('/agregar', async function(req,res) {
    var nuevoArtista = await ArtistaModel.create(
        {nombre: 'Juan', apellido: 'Garcia'}
        );
    res.send(nuevoArtista);
});

/* esta funcion dice: busca por id y actualiza */
app.get('/modificar', async function(req,res){
    await ArtistaModel.findByIdAndUpdate(
        {_id: '5e570932179b9c1b3412d3ff'},
        {nombre: 'Nuevo nombre', apellido: 'PROBANDO'}
    );
    res.send('ok');
});

/* borrado fisico */

app.get('/borrar', async function(req,res){
    var rta = await ArtistaModel.findByIdAndRemove(
    {_id: '5e570932179b9c1b3412d3ff'}
    );
    res.send(rta);
});

/* Funcion para contar la cantidad de visitas a una pagina, cada session es por navegador, si cambiamos de nav empieza de 0. El servidor guarda lo que ponemos en req.session...... */
app.get('/contar', function(req,res){
   if (!req.session.contador){    /* el! indica que si no esta inicializada empieza entonces en 0  */
       req.session.contador = 0;
   }
   req.session.contador ++; 
    res.json(req.session.contador);
});


app.get('/login', function (req,res){
    res.render('login');
});

/*
app.post('/login', async function (req,res){
    if(req.body.username =='admin' && req.body.password =='admin123'){
        res.send("OK");
        
    } else {
        res.send('Incorrecto');
    }

});
*/

const UsuarioSchema = mongoose.Schema({
 username: String,
 password: String,
 email: String 
})

const UsuarioModel = mongoose.model('usuario',
UsuarioSchema);

/* Lo que esta de los : hacia la izq es lo que esta en UsuarioModel. Me trae el user y password que escribio el usuario */
app.post('/login', async function(req,res){
    const user = await UsuarioModel.find({
        username: req.body.username,
        password:req.body.password
    });
    if (user.length!=0){
        req.session.user_id = user[0]._id; /* user_id es fijo. Esa linea solo se ejecuta cuando encuentra ese usuario en la base de datos */
        res.send('/listado');  /* Solo se ejecuta cuando la linea de arriba se ejecuta, o sea si encontro al usuario */
        res.send('ok')
    } else{
        res.send('incorrecto')
    }
});
/* API*/

/* API que Me trae un json con todo el listado  */
app.get('/api/artistas', async function(req,res){
    var listado = await ArtistaModel.find().lean();
    res.json(listado);    /* es lo mismo que res.send pero aca me devuelve un json */
});

/* me trae el json del id que yo le pedi, si pongo un id que no existe muestra el error 404*/
app.get('/api/artistas/:id', async function(req,res){
    try{
        var unArtista = await ArtistaModel.findById(req.params.id);   /* me trae solo el que tenga ese id*/
        res.json(unArtista);        
    } catch(e){
        res.status(404).send('error');
    }
    
});

app.post('/api/artistas', async function (req,res){
    var artista = await ArtistaModel.create({
        nombre: req.body.nombre,
        apellido: req.body.apellido
    });
    res.json(artista);
});

/* para actualizar un artista*/
app.put('/api/artistas/:id', async function(req,res){
try{
    await ArtistaModel.findByIdAndUpdate(
    req.params.id,
    {
    nombre: req.body.nombre,     //para que en nombre actualice al de req.body.nombre
    apellido: req.body.apellido
    }
    );
    res.status(200).send('ok');
} catch(e){
    res.status(404).send('error');
}
     });

/* para borrar un artista*/

app.delete('/api/artistas/:id', async function(req,res){
try{
    await ArtistaModel.findByIdAndDelete(req.params.id);
    res.status(204).send();   //error 204 va SIN contenido en el send (es sin contenido), si le quiero mandar algo al cliente poner error 200
} catch(e){
    res.status(404).send('no encontrado');
}   
});


// Para dar de alta un usuario
app.get('/signin', function(req,res){
    res.render('sigin_form');
});


app.post('/signin', async function(req,res){
    if(req.body.username =="" || req.body.password==""){
        res.render('sigin_form', {
            error: 'Los datos ingresados no son correctos', 
            datos: req.body       
        });
        return;
    }
    await UsuarioModel.create({
        username : req.body.username,   
        password: req.body.password,
        email: req.body.email
         });
    res.redirect('/login');   
});



app.get('/buscar', function(req,res){
    var listado = [
  {
    "userId": 1,
    "id": 1,
    "title": "delectus aut autem",
    "completed": false
  },
  {
    "userId": 1,
    "id": 2,
    "title": "quis ut nam facilis et officia qui",
    "completed": false
  },
  {
    "userId": 1,
    "id": 3,
    "title": "fugiat veniam minus",
    "completed": false
  },
  {
    "userId": 1,
    "id": 4,
    "title": "et porro tempora",
    "completed": true
  },
  {
    "userId": 1,
    "id": 5,
    "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
    "completed": false
  },
  {
    "userId": 1,
    "id": 6,
    "title": "qui ullam ratione quibusdam voluptatem quia omnis",
    "completed": false
  },
  {
    "userId": 1,
    "id": 7,
    "title": "illo expedita consequatur quia in",
    "completed": false
  },
  {
    "userId": 1,
    "id": 8,
    "title": "quo adipisci enim quam ut ab",
    "completed": true
  },
  {
    "userId": 1,
    "id": 9,
    "title": "molestiae perspiciatis ipsa",
    "completed": false
  },
  {
    "userId": 1,
    "id": 10,
    "title": "illo est ratione doloremque quia maiores aut",
    "completed": true
  },
  {
    "userId": 1,
    "id": 11,
    "title": "vero rerum temporibus dolor",
    "completed": true
  },
  {
    "userId": 1,
    "id": 12,
    "title": "ipsa repellendus fugit nisi",
    "completed": true
  },
  {
    "userId": 1,
    "id": 13,
    "title": "et doloremque nulla",
    "completed": false
  },
  {
    "userId": 1,
    "id": 14,
    "title": "repellendus sunt dolores architecto voluptatum",
    "completed": true
  },
  {
    "userId": 1,
    "id": 15,
    "title": "ab voluptatum amet voluptas",
    "completed": true
  },
  {
    "userId": 1,
    "id": 16,
    "title": "accusamus eos facilis sint et aut voluptatem",
    "completed": true
  },
  {
    "userId": 1,
    "id": 17,
    "title": "quo laboriosam deleniti aut qui",
    "completed": true
  },
  {
    "userId": 1,
    "id": 18,
    "title": "dolorum est consequatur ea mollitia in culpa",
    "completed": false
  },
  {
    "userId": 1,
    "id": 19,
    "title": "molestiae ipsa aut voluptatibus pariatur dolor nihil",
    "completed": true
  },
  {
    "userId": 1,
    "id": 20,
    "title": "ullam nobis libero sapiente ad optio sint",
    "completed": true
  }
];

    //buscar id=7
    for(i=0; i<listado.length; i++){
       if(listado[i].id==7){
           res.send(listado[i]);
       }
    }
    
    for(i=0; i<listado.length; i++){
       listado[i].usuario= 'Juan';
        {
           res.send(listado);
       }
    }
});

//

app.listen(80, function(){
    console.log('App en localhost');
});