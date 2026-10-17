// Modelo de la guia de espiritus: su copia y su estructura, sin una sola etiqueta de HTML.
//
// El mismo modelo alimenta las dos caras de la pagina: el generador estatico
// (src/seo/contenido.js, que lo renderiza) y la vista dentro de la aplicacion. Aqui solo hay
// datos: ni <h2>, ni class, ni escapado. Cada renderer decide como se pinta. Sin dependencias:
// se prueba con node --test.
import { porIdioma, rarezaEnIdioma, numeroEnIdioma } from './idioma.js';
import { colorDeRareza, degradadoDeRareza } from '../data/rarezaColores.js';

// La fecha va en el texto y en el idioma de la pagina: "4 de octubre de 2026" / "October 4, 2026".
export function formatearFecha(iso, lang) {
  if (!iso) return '';
  try {
    const locale = porIdioma(lang, { es: 'es-ES', en: 'en-US', 'pt-BR': 'pt-BR' });
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(iso + 'T00:00:00Z'));
  } catch {
    return iso;
  }
}

// Los decimales en portugues llevan coma (0,5%); en es e ingles se conserva el punto de siempre.
function decimal(lang, n) {
  return numeroEnIdioma(n, lang);
}

// Preguntas frecuentes, como pares [pregunta, respuesta]: la pagina las pinta y el JSON-LD las
// marca desde esta misma lista. Si divergieran, el marcado diria algo que el usuario no lee.
function preguntas(lang, datos) {
  const t = datos;
  if (lang === 'pt-BR') {
    return [
      ['O que são os espíritos do Fortnite?', 'São companheiros que aparecem durante a partida. Cada um concede uma habilidade enquanto você o carrega, de escudo extra a pulo duplo, e fica mais forte conforme sobe de nível.'],
      ['Quantos espíritos existem?', 'O Spritedex acompanha ' + t.total + ' espíritos: ' + t.familias + ' famílias com suas variantes.'],
      ['Como se consegue um espírito?', 'Eles aparecem em baús de espírito e zonas de extração, e alguns têm locais específicos. Cada ficha mostra onde aquele espírito aparece e sua probabilidade, que vai de ' + decimal(lang, t.dropMin) + '% a ' + decimal(lang, t.dropMax) + '%.'],
      ['Como funcionam os níveis?', 'Cada espírito vai do nível 1 ao 5 e sua habilidade cresce com o nível. Acompanhar isso aqui é o jeito de ver quais ainda precisam subir.'],
      ['Preciso de uma conta?', 'Não. Seu progresso fica guardado no seu próprio navegador, então nada é enviado e não é preciso se cadastrar.'],
      ['O Spritedex é oficial?', 'Não. É um projeto de fãs sem relação com a Epic Games.']
    ];
  }
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
      indice: 'Sections',
      faq: 'Frequent questions',
      datos: 'Data revised on ' + fecha + ' from the game and community sources. It can contain mistakes: if you see one, it is worth telling us.'
    };
  }
  if (lang === 'pt-BR') {
    return {
      que: 'O que é um espírito',
      queTexto: 'Um espírito é um companheiro que você pega durante a partida. Enquanto você o carrega, ele trabalha sozinho: dá escudo, recarrega suas armas, permite um pulo duplo, deixa itens cair. O poder dele cresce com o nível, então o mesmo espírito vale muito mais no 5 do que no 1.',
      familias: 'Famílias e variantes',
      familiasTexto: 'Os espíritos são agrupados por família (Água, Fogo, Fantasma, Jonesy, Peely…) e cada família tem variantes que mudam o visual: Básico, Dourado, Hacker, Hacker de Loot, Caçador de Recompensas, Doces ou Travessuras, Patinho e algumas outras. O Spritedex acompanha ' + datos.total + ' espíritos em ' + datos.familias + ' famílias.',
      rarezas: 'Raridades',
      rarezasTexto: 'A raridade indica o quão difícil é encontrar um espírito. Estas são as raridades da coleção atual:',
      conseguir: 'Como conseguir',
      conseguirTexto: 'Eles aparecem em baús de espírito e zonas de extração, e alguns têm locais próprios (rios, florestas, cidades, à noite…). A probabilidade muda muito de um para outro: nesta coleção ' + fraseDrop + '. A ficha de cada espírito mostra onde ele aparece.',
      niveles: 'Níveis do 1 ao 5',
      nivelesTexto: 'Todos os espíritos sobem de nível e a habilidade melhora a cada subida. Subir de nível é o que transforma um espírito que você já tem em um melhor, então um rastreador de coleção são, na prática, duas listas: o que você tem e o que ainda falta subir.',
      costo: 'Custo de invocação',
      costoTexto: 'Invocar um espírito custa Poeira Estelar, e a quantidade depende do espírito. Nesta coleção há ' + datos.costos + ' custos diferentes.',
      coleccion: 'Acompanhar a coleção',
      coleccionTexto: 'O Spritedex guarda a lista completa com família, variante, raridade e probabilidade, marca o que você tem, os níveis do 1 ao 5, compara com amigos e exporta um cartão para compartilhar. Sem conta e sem instalar: tudo fica guardado no seu navegador.',
      indice: 'Seções',
      faq: 'Perguntas frequentes',
      datos: 'Dados revisados em ' + fecha + ' a partir do jogo e de fontes da comunidade. Podem ter erros: se você encontrar algum, vale avisar.'
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
    indice: 'Secciones',
    faq: 'Preguntas frecuentes',
    datos: 'Datos revisados el ' + fecha + ' a partir del juego y de fuentes de la comunidad. Pueden tener errores: si ves uno, merece la pena avisar.'
  };
}

// El cuerpo de la guia en un idioma: secciones con titulo y bloques (parrafos, listas, tablas),
// el FAQ y la nota de revision. Los pares del FAQ son los mismos que marca el JSON-LD.
//
// Cada seccion lleva un `id` ESTABLE e independiente del idioma ('guia-rarezas' en es, en y
// pt-BR). De ahi salen las anclas del indice y el `aria-labelledby` que convierte cada seccion en
// una region navegable: si el id cambiara con el idioma, cualquier enlace compartido con ancla
// dejaria de funcionar al cambiar de version.
export function modeloGuia(lang, datos) {
  const fecha = formatearFecha(datos.fecha, lang);
  // Hay drops de una entre cien mil: decir "del 0.00001%" es cierto pero no se lee. Por debajo
  // del 0.01% se redacta como "menos del 0.01%", que sigue siendo verdad.
  const bajo = datos.dropMin > 0 && datos.dropMin < 0.01 ? null : datos.dropMin;
  const max = decimal(lang, datos.dropMax);
  const fraseDrop = porIdioma(lang, {
    en: (bajo === null ? 'goes from less than 0.01% to ' : 'goes from ' + bajo + '% to ') + datos.dropMax + '%',
    es: (bajo === null ? 'va de menos del 0.01% al ' : 'va del ' + bajo + '% al ') + datos.dropMax + '%',
    'pt-BR': (bajo === null ? 'vai de menos de 0,01% a ' : 'vai de ' + decimal(lang, bajo) + '% a ') + max + '%'
  });
  const t = copia(lang, datos, fraseDrop, fecha);
  const parrafo = (texto) => ({ tipo: 'parrafo', texto });
  return {
    lang,
    indice: t.indice,
    secciones: [
      { id: 'guia-que', titulo: t.que, bloques: [parrafo(t.queTexto)] },
      { id: 'guia-familias', titulo: t.familias, bloques: [parrafo(t.familiasTexto)] },
      {
        id: 'guia-rarezas',
        titulo: t.rarezas,
        bloques: [parrafo(t.rarezasTexto)],
        tabla: {
          titulo: porIdioma(lang, {
            es: 'Espíritus por rareza en la colección actual',
            en: 'Sprites per rarity in the current collection',
            'pt-BR': 'Espíritos por raridade na coleção atual'
          }),
          cabeceras: porIdioma(lang, {
            es: ['Rareza', 'Espíritus'],
            en: ['Rarity', 'Sprites'],
            'pt-BR': ['Raridade', 'Espíritos']
          }),
          // La celda de la rareza viaja como { texto, color, degradado }: los colores salen del
          // mismo mapa que usan las tarjetas de la app, asi que la tabla y la rejilla no pueden
          // discrepar. Special no trae color sino degradado: es la banda de arcoiris.
          filas: datos.porRareza.map((r) => [
            {
              texto: rarezaEnIdioma(r.nombre, lang),
              color: colorDeRareza(r.nombre),
              degradado: degradadoDeRareza(r.nombre)
            },
            r.n
          ])
        }
      },
      { id: 'guia-conseguir', titulo: t.conseguir, bloques: [parrafo(t.conseguirTexto)] },
      { id: 'guia-niveles', titulo: t.niveles, bloques: [parrafo(t.nivelesTexto)] },
      { id: 'guia-costo', titulo: t.costo, bloques: [parrafo(t.costoTexto)] },
      { id: 'guia-coleccion', titulo: t.coleccion, bloques: [parrafo(t.coleccionTexto)] }
    ],
    faq: { id: 'guia-faq', titulo: t.faq, entradas: preguntas(lang, datos) },
    nota: t.datos
  };
}
