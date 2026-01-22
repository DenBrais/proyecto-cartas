/*DEFINICION DE VARIABLES */
const cardContainer = document.querySelector("#card-container");
const infoContainer = document.querySelector("#info");
let click = 0;
let timerId = null;
let secondsElapsed = 0;
let movesCount = 0;
let matchesCount = 0;
let currentLevel;

//ARRAY PARA GUARDAR LA LISTA DE PAISES
let listaPaises = [];

//VARIABLE PARA CONSUMIR el api
const apiURL = "https://restcountries.com/v3.1/all?fields=name,flags,cca2";

//cartas seleccionadas por el usuario
let firstCardSelected = null;
let secondCardSelected = null;

/*LOAD DE LA PAGINA */

// obtengo el nivels eleccionado al cargar la pagina
currentLevel = (function () {
  const selected = document.querySelector("input[name='level']:checked");
  return selected ? parseInt(selected.value, 10) : null;
})();
// Exponer por conveniencia si se desea consultar desde consola u otros scripts
window.currentLevel = currentLevel;

//cargo la lista de paises al cargar la pagina
window.addEventListener("load", async () => {
  await fetchCountries();
  console.log("Lista de paises cargada:", listaPaises);

  //LLAMO A LA FUNCION PRINCIPAL DEL JUEGO
  generateGameLogic();
});

/*EVENTOS*/

// Evento de cambio delegado para radios de nivel
document.addEventListener("change", (e) => {
  if (e.target && e.target.matches("input[name='level']")) {
    const selectedValue = parseInt(e.target.value, 10);

    // Actualiza el estado global para uso fuera del callback
    currentLevel = selectedValue;
    window.currentLevel = currentLevel;

    /*LOGICA CUANDO CAMBIA EL NIVEL */
    //limpiar el juego anterior
    gameCleanUp();

    //LLAMO A LA FUNCION DE LOGICA DEL JUEGO
    generateGameLogic();

    alert(
      "Nivel: " +
        selectedValue / 2 +
        "\n" +
        "Parejas: " +
        (selectedValue * selectedValue) / 2,
    );
  }
});

/*    FUNCIONES */
//MAIN FUNCTION LOGICA DEL JUEGO
function generateGameLogic() {
  if (currentLevel !== null) {
    cardContainer.style.gridTemplateColumns = `repeat(${currentLevel}, 1fr)`;
    //obtengo los paises necesarios para el nivel actual
    const countriesForLevel = getCountriesForLevel(currentLevel);
    countriesForLevel.forEach((paises) => {
      cardContainer.appendChild(
        generateCardsFromLevel(
          paises.name.common,
          paises.flags.svg,
          paises.cca2,
        ),
      );
    });
  }
}
// Genera las cartas según el nivel
function generateCardsFromLevel(countryName, flagURL, countryCode) {
  //genro la carta
  const card = document.createElement("div");
  card.className = "card";
  card.id = countryCode;
  //genero el card-inner
  const cardInner = document.createElement("div");
  cardInner.className = "card-inner";

  //genero el frente de la carta
  const cardFront = document.createElement("div");
  cardFront.className = "card-front";
  cardFront.textContent = "Wich country???";
  cardFront.style.backgroundImage = "url('../img/askImage.jpg')";

  //genero el back de la carta
  const cardBack = document.createElement("div");
  cardBack.className = "card-back";
  cardBack.textContent = countryName;
  cardBack.style.backgroundImage = `url('${flagURL}')`;

  //armo la carta
  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  card.appendChild(cardInner);

  //asignarle los eventos a las cartas
  cardEventAssign(card);

  return card;
}

//funcion asignar eventos a las cartas generadas
function cardEventAssign(cardElement) {
  //evento para iluminar carta al pasar el mouse
  cardElement.addEventListener("mouseover", () => {
    cardElement.classList.add("iluminated");
  });

  //evento para quitar iluminacion al sacar el mouse
  cardElement.addEventListener("mouseout", () => {
    cardElement.classList.remove("iluminated");
  });

  //evento para voltear la carta al hacer click
  //y volverla a voltear automaticamente despues de 2 segundos
  cardElement.addEventListener("click", () => {
    //volteo la primera carta
    cardElement.classList.add("flipped");

    //aca activo el timer del juego
    if (click === 0) startTimer();
    click++; //cuando gane reseteo a 0

    //guardo la carta seleccionada y comparo con la segunda carta
    if (firstCardSelected === null) {
      firstCardSelected = cardElement;
    } else if (
      secondCardSelected === null &&
      cardElement !== firstCardSelected
    ) {
      secondCardSelected = cardElement;
      //comparar las dos cartas seleccionadas
      compararCartas();

      //si movescount es cero, el juego termino perdiste
      if (movesCount === 0) {
        alert("¡Juego terminado! No te quedan mas movimientos.");
        //resetear el juego
        gameCleanUp();

        //recargar la pagina para empezar de nuevo
        window.location.reload();
        return;
      }

      //si son iguales, las dejo volteadas
      if (firstCardSelected === null && secondCardSelected === null) {
        //ACTUALIZO LOS ACIERTOS
        matchesCount++;
        updateMovesDisplay();

        return;
      }

      //si no son iguales, las vuelvo a voltear despues de 2 segundos
      setTimeout(() => {
        firstCardSelected.classList.remove("flipped");
        secondCardSelected.classList.remove("flipped");

        //resetear las cartas seleccionadas
        firstCardSelected = null;
        secondCardSelected = null;
      }, 1000);
    }
  });
}
//funcion para actualizar el display de movimientos
function updateMovesDisplay() {
  const movesElement = document.getElementById("moves");
  movesElement.textContent = "Movimientos: " + movesCount;

  const matchesElement = document.getElementById("matches");
  matchesElement.textContent = "Aciertos: " + matchesCount;
}
//funcion para empezar el timer del juego
function startTimer() {
  //implementar timer
  const timer = document.createElement("div");
  timer.id = "timer";
  timer.textContent = "Tiempo: " + secondsElapsed + "s";
  infoContainer.appendChild(timer);

  //implementar movimientos
  const moves = document.createElement("div");
  moves.id = "moves";
  moves.textContent = "Movimientos: 0";
  infoContainer.appendChild(moves);

  //implementar aciertos
  const matches = document.createElement("div");
  matches.id = "matches";
  matches.textContent = "Aciertos: 0";
  infoContainer.appendChild(matches);

  //implementar mejor tiempo
  const bestTime = document.createElement("div");
  bestTime.id = "best-time";
  bestTime.textContent = "Mejor Tiempo: 0s";
  infoContainer.appendChild(bestTime);

  //iniciar el timer
  timerId = setInterval(() => {
    secondsElapsed++;
    timer.textContent = "Tiempo: " + secondsElapsed + "s";
  }, 1000);
  console.warn(currentLevel);

  //implementar movimientos y aciertos
  movesCount = (currentLevel * currentLevel) / 2; //inicializo en la cantidad de pares
  updateMovesDisplay();
  matchesCount = 0;
}
//funcion para comparar las cartas seleccionadas
compararCartas = () => {
  if (firstCardSelected.id === secondCardSelected.id) {
    setTimeout(() => {
      alert("¡Match encontrado!");
    }, 500);
    //bloquear las cartas que hicieron match
    firstCardSelected.classList.add("blocked");
    secondCardSelected.classList.add("blocked");

    //resetear las cartas seleccionadas
    firstCardSelected = null;
    secondCardSelected = null;
  } else {
    //restar un movimiento
    movesCount--;
    updateMovesDisplay();
  }
};
//funcion para obtener el valor del radio button seleccionado
function getSelectedRadioValue() {
  const selected = document.querySelector("input[name='level']:checked");
  return selected ? parseInt(selected.value, 10) : null;
}

//funcion para consumir el api de paises
async function fetchCountries() {
  try {
    const response = await fetch(apiURL);
    listaPaises = await response.json();
    console.log("Countries fetched:", listaPaises);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

//funcion para obtener paises necesarios
function getCountriesForLevel(level) {
  const numPairs = (level * level) / 2;
  const selectedCountries = [...listaPaises]
    .sort(() => 0.5 - Math.random())
    .slice(0, numPairs);

  console.log("Selected countries for level", level, ":", selectedCountries);

  //NECESITO UN NUEVO VECTOR QUE TENGA CADA PAIS 2 VECES
  const pairedCountries = [];
  selectedCountries.forEach((country) => {
    pairedCountries.push(country);
    pairedCountries.push(country);
  });

  //MEZCLAR EL VECTOR DE PAISES PAREADOS
  pairedCountries.sort(() => 0.5 - Math.random());

  return pairedCountries;
}

//funcion de limpieza del juego anterior
function gameCleanUp() {
  // Limpiar el contenedor y regenerar las cartas
  cardContainer.innerHTML = "";
  //resetear el infocontainer
  infoContainer.innerHTML = "";
  // Resetear variables del juego
  click = 0;
  secondsElapsed = 0;
  clearInterval(timerId);
  timerId = null;
  secondsElapsed = 0;
  movesCount = 0;
  matchesCount = 0;
}
/*ligar el input tipo radio de manera que el seleccionado me indique,
en el value, cuantos pares de cartas debo hacer
--crear una funcion que genere las cartas en el html segun la cantidad seleccionada
*/

/*
consumir un api de banderas de paises
--seleccionar la lista de banderas en un array
--crear una funcion que seleccione la cantidad de banderas requeridas
--darle a los pares de tarjetas  la misma imagen y el mismo atributo data-value
--mezclar las cartas de manera aleatoria antes de mostrarlas en el html
*/

/*
--crear una funcion que maneje la logica del juego (seleccion de cartas, comparacion, conteo de intentos y aciertos)
 */

/*hacer una funcion llamada card-checked, que me permita saber si hay match 
--dentro del metodo card-checked debe haber una manera de saber si hay seleccionadas 
--2 cartas, si hay 2 cartas seleccionadas, comparar sus atributos data-value
--si son iguales, dejar las cartas al reves (con la clase flipped)
--si no son iguales, volver a ponerlas boca abajo (quitar la clase flipped)
--luego vaciar el array de cartas seleccionadas para poder seleccionar otras 2 cartas
--ademas, llevar un conteo de los intentos y de los aciertos
 */
