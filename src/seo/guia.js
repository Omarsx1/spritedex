// Modelo de la guia de espiritus: su copia y su estructura, sin una sola etiqueta de HTML.
//
// El mismo modelo alimenta las dos caras de la pagina: el generador estatico
// (src/seo/contenido.js, que lo renderiza) y la vista dentro de la aplicacion. Aqui solo hay
// datos: ni <h2>, ni class, ni escapado. Cada renderer decide como se pinta. Sin dependencias:
// se prueba con node --test.

// La fecha va en el texto y en el idioma de la pagina: "4 de octubre de 2026" / "October 4, 2026".
export function formatearFecha(iso, lang) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(iso + 'T00:00:00Z'));
  } catch {
    return iso;
  }
}

// Preguntas frecuentes, como pares [pregunta, respuesta]: la pagina las pinta y el JSON-LD las
// marca desde esta misma lista. Si divergieran, el marcado diria algo que el usuario no lee.
function preguntas(lang, datos) {
  const t = datos;
  if (lang === 'en') {
    return [
      ['What are Fortnite sprites?', 'Sprites are companions you find during a match. Each one grants an ability while you carry it, from extra shields to a double jump, and it gets stronger as you level it up.'],
      ['How many sprites are there?', 'Spritedex tracks ' + t.total + ' sprites: ' + t.familias + ' families with their variants.'],
      ['How do you get a sprite?', 'They appear in sprite chests and extraction zones, and some have specific spawn spots. Each page lists where that sprite is found and its drop chance, from ' + t.dropMin + '% to ' + t.dropMax + '%.'],
      ['How do sprite levels work?', 'Each sprite goes from level 1 to 5 and its ability scales with the level. Tracking them here is how you see which ones still need leveling.'],
      ['Do I need an account?', 'No. Your progress is stored in your own browser, so nothing is uploaded and no sign-up is required.'],
      ['Is Spritedex official?', 'No. It is a fan project with no relation to Epic Games.']
    ];
  }
  return [
    ['¿Qué son los espíritus de Fortnite?', 'Son compañeros que aparecen durante la partida. Cada uno concede una habilidad mientras lo llevas, desde escudo extra hasta un salto doble, y se vuelve más fuerte según sube de nivel.'],
    ['¿Cuántos espíritus hay?', 'El Spritedex sigue ' + t.total + ' espíritus: ' + t.familias + ' familias con sus variantes.'],
    ['¿Cómo se consigue un espíritu?', 'Aparecen en cofres de espíritu y zonas de extracción, y algunos tienen sitios concretos. Cada ficha dice dónde aparece el suyo y su probabilidad, que va del ' + t.dropMin + '% al ' + t.dropMax + '%.'],
    ['¿Cómo funcionan los niveles?', 'Cada espíritu va del nivel 1 al 5 y su habilidad mejora con cada subida. Aquí es donde se ve cuáles te faltan por subir.'],
    ['¿Necesito una cuenta?', 'No. Tu progreso se guarda en tu propio navegador, así que no se sube nada y no hay que registrarse.'],
    ['¿Spritedex es oficial?', 'No. Es un proyecto de fans sin relación con Epic Games.']
  ];
}

// La copia de la guia en el idioma pedido, con los numeros de la coleccion ya interpolados.
function copia(lang, datos, fraseDrop, fecha) {
  if (lang === 'en') {
    return {
      que: 'What a sprite is',
      queTexto: 'A sprite is a companion you pick up during a match. While you carry it, it works on its own: it gives you shields, reloads your weapons, lets you double jump, drops loot. Its power grows with its level, so the same sprite is worth much more at 5 than at 1.',
      familias: 'Families and variants',
      familiasTexto: 'Sprites are grouped by family (Water, Fire, Ghost, Jonesy, Peely…) and each family has variants that change how it looks: Basic, Gold, Hacker, Loot Hacker, Bounty Hunter, Trick or Treat, Quack and a few more. Spritedex tracks ' + datos.total + ' sprites across ' + datos.familias + ' families.',
      rarezas: 'Rarities',
      rarezasTexto: 'Rarity describes how hard a sprite is to find. These are the rarities in the current collection:',
      conseguir: 'How to get them',
      conseguirTexto: 'They show up in sprite chests and extraction zones, and some have their own spawn spots (rivers, forests, cities, at night…). The drop chance changes a lot from one sprite to another: in this collection it ' + fraseDrop + '. Each sprite page says where that one is found.',
      niveles: 'Levels 1 to 5',
      nivelesTexto: 'Every sprite levels up and its ability scales with it. Levelling is what turns a sprite you already have into a better one, so a collection tracker is really two lists: what you own and what you still have to level.',
      costo: 'Summon cost',
      costoTexto: 'Summoning a sprite costs Stardust, and the amount depends on the sprite. This collection has ' + datos.costos + ' different costs.',
      coleccion: 'Tracking the collection',
      coleccionTexto: 'Spritedex keeps the whole list with family, variant, rarity and drop chance, marks what you own, levels from 1 to 5, compares with friends and exports a card to share. No account and no install: everything is stored in your browser.',
      faq: 'Frequent questions',
      datos: 'Data revised on ' + fecha + ' from the game and community sources. It can contain mistakes: if you see one, it is worth telling us.'
    };
  }
  return {
    que: 'Qué es un espíritu',
    queTexto: 'Un espíritu es un compañero que recoges durante la partida. Mientras lo llevas, trabaja solo: te da escudo, recarga tus armas, te deja hacer un salto doble, suelta botín. Su poder crece con el nivel, así que el mismo espíritu vale mucho más en el 5 que en el 1.',
    familias: 'Familias y variantes',
    familiasTexto: 'Los espíritus se agrupan por familia (Agua, Fuego, Fantasma, Jonesy, Peely…) y cada familia tiene variantes que cambian su aspecto: Básico, Dorado, Hacker, Hacker de Botín, Cazarrecompensas, Dulce o Truco, Patito y algunas más. El Spritedex sigue ' + datos.total + ' espíritus repartidos en ' + datos.familias + ' familias.',
    rarezas: 'Rarezas',
    rarezasTexto: 'La rareza indica lo difícil que es encontrar un espíritu. Estas son las de la colección actual:',
    conseguir: 'Cómo conseguirlos',
    conseguirTexto: 'Aparecen en cofres de espíritu y zonas de extracción, y algunos tienen sitios propios (ríos, bosques, ciudades, de noche…). La probabilidad cambia mucho de uno a otro: en esta colección ' + fraseDrop + '. La ficha de cada espíritu dice dónde aparece el suyo.',
    niveles: 'Niveles del 1 al 5',
    nivelesTexto: 'Todos los espíritus suben de nivel y su habilidad mejora con cada subida. Subir de nivel es lo que convierte un espíritu que ya tienes en uno mejor, así que un rastreador de colección son en realidad dos listas: lo que tienes y lo que te falta subir.',
    costo: 'Costo de invocación',
    costoTexto: 'Invocar un espíritu cuesta Polvo Estelar, y la cantidad depende del espíritu. En esta colección hay ' + datos.costos + ' costos distintos.',
    coleccion: 'Seguir la colección',
    coleccionTexto: 'El Spritedex tiene la lista completa con familia, variante, rareza y probabilidad, marca lo que tienes, los niveles del 1 al 5, compara con amigos y exporta una tarjeta para compartir. Sin cuenta y sin instalar: todo se guarda en tu navegador.',
    faq: 'Preguntas frecuentes',
    datos: 'Datos revisados el ' + fecha + ' a partir del juego y de fuentes de la comunidad. Pueden tener errores: si ves uno, merece la pena avisar.'
  };
}

// El cuerpo de la guia en un idioma: secciones con titulo y bloques (parrafos, listas, tablas),
// el FAQ y la nota de revision. Los pares del FAQ son los mismos que marca el JSON-LD.
export function modeloGuia(lang, datos) {
  const enIngles = lang === 'en';
  const fecha = formatearFecha(datos.fecha, lang);
  // Hay drops de una entre cien mil: decir "del 0.00001%" es cierto pero no se lee. Por debajo
  // del 0.01% se redacta como "menos del 0.01%", que sigue siendo verdad.
  const bajo = datos.dropMin > 0 && datos.dropMin < 0.01 ? null : datos.dropMin;
  const fraseDrop = enIngles
    ? (bajo === null ? 'goes from less than 0.01% to ' : 'goes from ' + bajo + '% to ') + datos.dropMax + '%'
    : (bajo === null ? 'va de menos del 0.01% al ' : 'va del ' + bajo + '% al ') + datos.dropMax + '%';
  const t = copia(lang, datos, fraseDrop, fecha);
  const parrafo = (texto) => ({ tipo: 'parrafo', texto });
  return {
    lang,
    secciones: [
      { titulo: t.que, bloques: [parrafo(t.queTexto)] },
      { titulo: t.familias, bloques: [parrafo(t.familiasTexto)] },
      {
        titulo: t.rarezas,
        bloques: [parrafo(t.rarezasTexto)],
        tabla: {
          cabeceras: [enIngles ? 'Rarity' : 'Rareza', enIngles ? 'Sprites' : 'Espíritus'],
          filas: datos.porRareza.map((r) => [r.nombre, r.n])
        }
      },
      { titulo: t.conseguir, bloques: [parrafo(t.conseguirTexto)] },
      { titulo: t.niveles, bloques: [parrafo(t.nivelesTexto)] },
      { titulo: t.costo, bloques: [parrafo(t.costoTexto)] },
      { titulo: t.coleccion, bloques: [parrafo(t.coleccionTexto)] }
    ],
    faq: { titulo: t.faq, entradas: preguntas(lang, datos) },
    nota: t.datos
  };
}
