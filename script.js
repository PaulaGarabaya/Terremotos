//CONFIGURACIÓN FIREBASE
  const firebaseConfig = {
    apiKey: "AIzaSyASo3d6F6FxhTZ57ORvh2SgSe_KWCpLJms",
    authDomain: "fir-web-51f11.firebaseapp.com",
    projectId: "fir-web-51f11",
    storageBucket: "fir-web-51f11.firebasestorage.app",
    messagingSenderId: "717170299705",
    appId: "1:717170299705:web:abec39ed414d9f3e4c4ee8"
  };//datos de conexión

firebase.initializeApp(firebaseConfig);// Inicializaar app Firebase

const db = firebase.firestore();
	const auth = firebase.auth();

//MAPA 1
//crear mapa
let map = L.map('map').setView([20, 0], 2); // Zoom general sobre el planeta

//capa del mapa
var GeoportailFrance_plan = L.tileLayer('https://data.geopf.fr/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
	attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
	bounds: [[-75, -180], [81, 180]],
	minZoom: 2,
	maxZoom: 18,
	format: 'image/png',
	style: 'normal'
}).addTo(map);

//obtiene los datos de los terremotos (descarga los terremotos del dia)
async function getData(){
    try{
        const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
        const data = await res.json();
        return data.features;
    }
    catch(e){
        console.log(e);
    }
}

//colores según magnitud
function getColor(mag) {
  if (mag >= 7) {
    return "#ff00c3"
  } ;
  if (mag >= 6){
    return "#ff0000"
  } ;
  if (mag >= 5){
    return "#f6a400"
  } ;
  if (mag >= 4){
    return "#d1b123"
  } ;
  if (mag >= 3) {
    return "#ffff00"
  } ;
  if (mag >= 2){
    return "#93c928"
  } ;
  if (mag >= 1){
    return "#3eb91c"
  } ;
  return "#929292";
}

//Poner terremotos en el mapa
getData().then(data => {
    
    console.log(data);
    //Agregar marcador
    
    data.map(pin => {
        //Tratamiento de datos

        const coordinates_pin = [pin.geometry.coordinates[1], pin.geometry.coordinates[0]];
        
        // Representación de datos
        const mag = Number(pin.properties.mag) || 0; // convierte mag en número y para que no de undefined
        const marker = L.circleMarker(coordinates_pin, {
            radius: mag > 0 ? mag * 2 : 3,  // tamaño según magnitud
            fillColor: getColor(mag),       
            color: "#fdfdfdff",              
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        })

            .bindPopup(`Titulo: ${pin.properties.title} <br> Fecha: ${new Date(pin.properties.time).toLocaleString()} <br> Ubicación: ${pin.properties.place} 
                <br> Códgio: ${pin.properties.code} <br> Magnitud: ${pin.properties.mag} <br><button class='fav-btn'>Añadir a favoritos</button>`)
            .addTo(map);

        marker.on('popupopen', () => {
            const favButton = document.querySelector('.fav-btn');
            if (favButton) {
                favButton.addEventListener('click', () => {
                    alert('favorito guardado');
                });
            }

        });
    });

});
//LEYENDA
// --- Crear círculos de color en la leyenda ---
document.addEventListener("DOMContentLoaded", () => {
  const leyenda = document.getElementById("leyenda");
  const niveles = [
    { nivel: "Magnitud 0-1", color: getColor(0.5) },
    { nivel: "Magnitud 1-2", color: getColor(1.5) },
    { nivel: "Magnitud 2-3", color: getColor(2.5) },
    { nivel: "Magnitud 3-4", color: getColor(3.5) },
    { nivel: "Magnitud 4-5", color: getColor(4.5) },
    { nivel: "Magnitud 5-6", color: getColor(5.5) },
    { nivel: "Magnitud 6-7", color: getColor(6.5) },
    { nivel: "Magnitud 7+", color: getColor(7) }
  ];

  // Crear círculos
  niveles.forEach(item => {
    const p = document.createElement("p");

    const circle = document.createElement("span");
    circle.style.display = "inline-block";
    circle.style.width = "15px";
    circle.style.height = "15px";
    circle.style.borderRadius = "50%";
    circle.style.marginRight = "8px";
    circle.style.backgroundColor = item.color;
    circle.style.verticalAlign = "middle";

    p.appendChild(circle);
    p.append(item.nivel);

    leyenda.appendChild(p);
  });
});
 
// ==== MAPA 2 ======

let datosTerremotos = []; 
let map2 = L.map('map2').setView([20, 0], 2); // Zoom general sobre el planeta

var GeoportailFrance_plan = L.tileLayer('https://data.geopf.fr/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
	attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
	bounds: [[-75, -180], [81, 180]],
	minZoom: 2,
	maxZoom: 18,
	format: 'image/png',
	style: 'normal'
}).addTo(map2);

let marcadorTerremoto = L.layerGroup().addTo(map2)//para añadir los terremotos filtrados
// definir rango magnitud
let magnitudMin = 0;
let magnitudMax = 10;

let fechaInicio = null; //inicialmente no hay filtro por fecha
let fechaFin = null;

// Cargar los datos y muestra los que cumplen el filtro.
getData().then(data => {
  datosTerremotos = data;
  mapaFiltrado();
});


// FILTRO  MAGNITUD
function mapaFiltrado() {
  marcadorTerremoto.clearLayers(); //elimina marcadores anteriores para que no se acumulen los terremotos al filtrar

  const filtrados = datosTerremotos.filter(pin => {//recorre los terremotos y aplica los filtros
    const mag = Number(pin.properties.mag) || 0;
    const time = pin.properties.time;

    // Comprobación de magnitud. este dentro del rango definido.
    const pasaMagnitud = mag >= magnitudMin && mag < magnitudMax;

    // Comprobación de fecha (solo si ambas fechas están seleccionadas)
    let pasaFecha = true; //que se filtre aunque no tenga seleccion

    if (fechaInicio && fechaFin) {
      pasaFecha = time >= fechaInicio && time <= fechaFin;
    }

    return pasaMagnitud && pasaFecha;
  });

  filtrados.forEach(pin => {
    const mag = Number(pin.properties.mag) || 0;
    const coords = [pin.geometry.coordinates[1], pin.geometry.coordinates[0]];

    L.circleMarker(coords, {
      radius: mag > 0 ? mag * 2 : 3,
      fillColor: getColor(mag),
      color: "#fff",
      weight: 1,
      fillOpacity: 0.7
    })
        .bindPopup(`Titulo: ${pin.properties.title} <br> Fecha: ${new Date(pin.properties.time).toLocaleString()} <br> Ubicación: ${pin.properties.place} 
                <br> Códgio: ${pin.properties.code} <br> Magnitud: ${pin.properties.mag} <br><button class='fav-btn'>Añadir a favoritos</button>`)
        .addTo(marcadorTerremoto);
    });
}

// Eventos de los botones de magnitud
document.querySelectorAll(".filtro-btn").forEach(btn => {
  btn.addEventListener("click", () => { //añade boton a cada evento
    document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active")); //que solo el boton clicado este activo
    btn.classList.add("active"); //para que se vea diferente. acceder y modificar las clases CSS
    //pasa a numeros los valores para poder filtrar
    magnitudMin = parseFloat(btn.dataset.min);
    magnitudMax = parseFloat(btn.dataset.max);
    mapaFiltrado();
  });
});

// FILTRO POR FECHA
document.getElementById('applyFilters').addEventListener('click', () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert("Selecciona las dos fechas.");
    return;
  }

  fechaInicio = new Date(startDate).getTime();
  fechaFin = new Date(endDate).getTime();

  mapaFiltrado();
});



// 3. Firebase Firestore. Modificar mapa 1. Añadir un botón al popup para guardar favorito




// 4. Firebase Auth. Autenticación en el sistema.

/**************Firebase Auth*****************/
// Create user
const createUser = (user) => {
  db.collection("users")//accede a la coleccion en firestore
    .doc(user.id) // Usar el UID del usuario como ID del documento en Firestore
    .set({ //guardar los datos
      email: user.email,
      favorites: [] // Crear array de favoritos vacío
    })
    .then(() => console.log("Usuario creado con ID: ", user.id))
    .catch((error) => console.error("Error creando usuario: ", error));
};

// Sign up
const signUpUser = (email, password) => {
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password) // crear usuario neuvo
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha registrado ${user.email} ID:${user.uid}`)
      alert(`se ha registrado ${user.email} ID:${user.uid}`)
      // ...
      // Saves user in firestore
      createUser({
        id: user.uid,
        email: user.email
      });

    })
    .catch((error) => {
      console.log("Error en el sistema" + error.message, "Error: " + error.code);
    });
};


document.getElementById("form1").addEventListener("submit", function (event) {
  event.preventDefault();
  let email = event.target.elements.email.value; //extare email y contraseñas
  let pass = event.target.elements.pass.value;
  let pass2 = event.target.elements.pass2.value;

  pass === pass2 ? signUpUser(email, pass) : alert("error password"); //para que sean iguales las contraseñas
})

// Sign in
const signInUser = (email, password) => {
  firebase.auth().signInWithEmailAndPassword(email, password) //inicio sesion
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha logado ${user.email} ID:${user.uid}`)
      alert(`se ha logado ${user.email} ID:${user.uid}`)
      console.log("USER", user);
    })
    .catch((error) => {
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode)
      console.log(errorMessage)
    });
}

// Sign out user
const signOut = () => {
  let user = firebase.auth().currentUser; //obtiene el user actual

  firebase.auth().signOut().then(() => { //cerrar sesion
    console.log("Sale del sistema: " + user.email)
  }).catch((error) => {
    console.log("hubo un error: " + error);
  });
}

document.getElementById("form2").addEventListener("submit", function (event) { // 
  event.preventDefault();//evita recargar la pagina
  let email = event.target.elements.email2.value;
  let pass = event.target.elements.pass3.value;
  signInUser(email, pass) //autenficar al usuario
})
document.getElementById("salir").addEventListener("click", signOut);//cerrar sesion

// Listener de usuario en el sistema
// Controlar usuario logado
firebase.auth().onAuthStateChanged(function (user) { 
  if (user) {
    console.log(`Está en el sistema:${user.email} ${user.uid}`);
    document.getElementById("message").innerText = `Está en el sistema: ${user.uid}`;
  } else {
    console.log("no hay usuarios en el sistema");
    document.getElementById("message").innerText = `No hay usuarios en el sistema`;
  }
});