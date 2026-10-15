/**
 * Curated Brazilian-language recipe catalog for the deterministic eBook engine.
 * No API calls, health-outcome promises, fabricated nutrition facts or external keys.
 * All 50 entries have measured ingredients and at least 3 executable steps.
 */
export type Recipe = {
  category: "cafe"|"almoco"|"jantar"|"lanche"|"sobremesa";
  title:string; ingredients:string[]; steps:string[]; minutes:number; servings:number;
};
export const RECIPE_CATALOG:ReadonlyArray<Recipe> = [
  {
    "category": "cafe",
    "title": "Aveia cremosa com banana e canela",
    "ingredients": [
      "4 colheres (sopa) de aveia",
      "200 ml de leite ou bebida vegetal",
      "1 banana madura",
      "1 pitada de canela"
    ],
    "steps": [
      "Aqueça a aveia com o leite em fogo baixo, mexendo por 5 minutos",
      "Amasse metade da banana e misture ao mingau até ficar cremoso",
      "Sirva com o restante da banana fatiada e canela"
    ],
    "minutes": 10,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Iogurte com mamão e chia",
    "ingredients": [
      "1 pote de iogurte natural sem açúcar (170 g)",
      "1/2 mamão papaia",
      "1 colher (sopa) de chia",
      "1 colher (sopa) de aveia"
    ],
    "steps": [
      "Descasque e corte o mamão em cubos",
      "Coloque o iogurte em uma tigela e misture a aveia",
      "Finalize com o mamão e a chia e sirva imediatamente"
    ],
    "minutes": 5,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Omelete de espinafre e tomate",
    "ingredients": [
      "2 ovos",
      "1 punhado de espinafre lavado",
      "1/2 tomate picado",
      "1 colher (chá) de azeite",
      "1 pitada de sal e orégano"
    ],
    "steps": [
      "Bata os ovos com o sal e o orégano",
      "Refogue o espinafre e o tomate no azeite por 2 minutos",
      "Despeje os ovos e cozinhe dos dois lados até firmarem completamente"
    ],
    "minutes": 12,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Tapioca com ricota e ervas",
    "ingredients": [
      "3 colheres (sopa) de goma de tapioca hidratada",
      "3 colheres (sopa) de ricota amassada",
      "1 colher (sopa) de tomate picado",
      "salsinha e orégano a gosto"
    ],
    "steps": [
      "Espalhe a tapioca em uma frigideira antiaderente aquecida",
      "Cozinhe até formar um disco firme e vire rapidamente",
      "Misture ricota, tomate e ervas, recheie e dobre antes de servir"
    ],
    "minutes": 10,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Panqueca de banana e aveia",
    "ingredients": [
      "1 banana madura",
      "1 ovo",
      "3 colheres (sopa) de aveia",
      "1 pitada de canela",
      "1 colher (chá) de óleo para untar"
    ],
    "steps": [
      "Amasse a banana e misture com o ovo, a aveia e a canela",
      "Unte levemente uma frigideira e coloque pequenas porções da massa",
      "Doure em fogo baixo dos dois lados até cozinhar por dentro"
    ],
    "minutes": 15,
    "servings": 2
  },
  {
    "category": "cafe",
    "title": "Pão integral com ovo e abacate",
    "ingredients": [
      "2 fatias de pão integral",
      "1 ovo",
      "1/4 de abacate pequeno",
      "1 colher (chá) de limão",
      "1 pitada de sal"
    ],
    "steps": [
      "Cozinhe ou mexa o ovo até ficar completamente firme",
      "Amasse o abacate com o limão e uma pitada de sal",
      "Toste o pão, espalhe o abacate e coloque o ovo por cima"
    ],
    "minutes": 12,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Vitamina de morango com aveia",
    "ingredients": [
      "1 xícara de morangos lavados",
      "200 ml de leite ou bebida vegetal",
      "2 colheres (sopa) de aveia",
      "1/2 banana congelada"
    ],
    "steps": [
      "Lave os morangos e retire as folhas",
      "Bata todos os ingredientes no liquidificador até ficar homogêneo",
      "Sirva logo após o preparo, sem necessidade de adoçar"
    ],
    "minutes": 5,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Cuscuz de milho com ovo mexido",
    "ingredients": [
      "1/2 xícara de flocão de milho",
      "1/4 de xícara de água",
      "2 ovos",
      "1 colher (chá) de azeite",
      "1 pitada de sal"
    ],
    "steps": [
      "Umedeça o flocão com a água e descanse por 10 minutos",
      "Cozinhe o cuscuz na cuscuzeira por cerca de 10 minutos",
      "Mexa os ovos no azeite até firmar e sirva sobre o cuscuz"
    ],
    "minutes": 25,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Crepioca de queijo branco",
    "ingredients": [
      "1 ovo",
      "2 colheres (sopa) de tapioca hidratada",
      "2 fatias finas de queijo branco",
      "1 pitada de orégano"
    ],
    "steps": [
      "Misture o ovo e a tapioca até formar massa líquida",
      "Despeje na frigideira antiaderente e cozinhe até firmar dos dois lados",
      "Adicione o queijo e o orégano, dobre e aqueça até o queijo amolecer"
    ],
    "minutes": 10,
    "servings": 1
  },
  {
    "category": "cafe",
    "title": "Pote de aveia com maçã preparado de véspera",
    "ingredients": [
      "4 colheres (sopa) de aveia",
      "150 ml de leite",
      "1/2 maçã picada",
      "1 colher (chá) de chia",
      "canela a gosto"
    ],
    "steps": [
      "Misture aveia, leite, chia e canela em um pote com tampa",
      "Acrescente a maçã em cubos e mexa",
      "Tampe, refrigere por pelo menos 6 horas e consuma gelado"
    ],
    "minutes": 10,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Frango grelhado com arroz integral e brócolis",
    "ingredients": [
      "120 g de filé de frango",
      "3 colheres (sopa) de arroz integral cozido",
      "1 xícara de brócolis",
      "1 colher (chá) de azeite",
      "alho e limão a gosto"
    ],
    "steps": [
      "Tempere o frango com alho, limão e pouco sal",
      "Grelhe em frigideira quente até cozinhar completamente",
      "Cozinhe o brócolis no vapor e sirva com o arroz aquecido e o frango"
    ],
    "minutes": 25,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Bowl de quinoa com grão-de-bico",
    "ingredients": [
      "1/2 xícara de quinoa cozida",
      "1/2 xícara de grão-de-bico cozido",
      "1/2 pepino picado",
      "1 tomate picado",
      "1 colher (chá) de azeite",
      "limão e salsinha"
    ],
    "steps": [
      "Escorra o grão-de-bico e deixe esfriar",
      "Misture quinoa, grão-de-bico, pepino e tomate em uma tigela",
      "Tempere com azeite, limão e salsinha pouco antes de servir"
    ],
    "minutes": 15,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Peixe assado com batata-doce e abobrinha",
    "ingredients": [
      "1 filé de peixe de 150 g",
      "1 batata-doce pequena",
      "1/2 abobrinha fatiada",
      "1 colher (chá) de azeite",
      "limão e ervas a gosto"
    ],
    "steps": [
      "Corte a batata-doce em rodelas e asse por 15 minutos a 200 °C",
      "Acrescente o peixe e a abobrinha temperados com limão e ervas",
      "Asse por mais 20 minutos ou até o peixe ficar opaco e cozido por inteiro"
    ],
    "minutes": 40,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Salada morna de lentilha e legumes",
    "ingredients": [
      "3/4 de xícara de lentilha cozida",
      "1 cenoura pequena",
      "1/2 abobrinha",
      "1 colher (chá) de azeite",
      "cebola e cheiro-verde a gosto"
    ],
    "steps": [
      "Corte a cenoura e a abobrinha em cubos pequenos",
      "Refogue a cebola no azeite, junte os legumes e cozinhe até amaciar",
      "Adicione a lentilha já cozida, aqueça e finalize com cheiro-verde"
    ],
    "minutes": 20,
    "servings": 2
  },
  {
    "category": "almoco",
    "title": "Carne moída magra com abóbora",
    "ingredients": [
      "120 g de patinho moído",
      "1 xícara de abóbora em cubos",
      "1/2 cebola picada",
      "1 tomate picado",
      "1 colher (chá) de azeite"
    ],
    "steps": [
      "Refogue cebola e patinho no azeite, mexendo até dourar bem",
      "Acrescente tomate e abóbora com um pouco de água",
      "Tampe e cozinhe até a abóbora ficar macia e a carne completamente cozida"
    ],
    "minutes": 30,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Arroz integral colorido com ervilha",
    "ingredients": [
      "1 xícara de arroz integral cozido",
      "1/4 de xícara de ervilha",
      "1/2 cenoura ralada",
      "1/4 de pimentão picado",
      "1 colher (chá) de azeite"
    ],
    "steps": [
      "Refogue a cenoura e o pimentão no azeite por 3 minutos",
      "Junte a ervilha e cozinhe até ficar macia",
      "Adicione o arroz cozido, misture e aqueça completamente antes de servir"
    ],
    "minutes": 15,
    "servings": 2
  },
  {
    "category": "almoco",
    "title": "Macarrão integral com atum e tomate",
    "ingredients": [
      "70 g de macarrão integral seco",
      "1/2 lata de atum em água escorrido",
      "1 tomate grande picado",
      "1 colher (chá) de azeite",
      "alho e manjericão"
    ],
    "steps": [
      "Cozinhe o macarrão conforme a embalagem e escorra",
      "Refogue o alho e o tomate no azeite até formar um molho rústico",
      "Misture o atum escorrido e o macarrão e finalize com manjericão"
    ],
    "minutes": 20,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Frango desfiado com purê de couve-flor",
    "ingredients": [
      "120 g de frango cozido e desfiado",
      "2 xícaras de couve-flor",
      "2 colheres (sopa) de leite",
      "1 colher (chá) de azeite",
      "cebola e noz-moscada"
    ],
    "steps": [
      "Cozinhe a couve-flor até ficar macia e bata com o leite e noz-moscada",
      "Refogue a cebola e aqueça o frango desfiado no azeite",
      "Sirva o frango sobre o purê quente"
    ],
    "minutes": 25,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Tilápia na frigideira com salada crocante",
    "ingredients": [
      "1 filé de tilápia de 150 g",
      "2 folhas de alface",
      "1/2 cenoura ralada",
      "1/2 pepino",
      "1 colher (chá) de azeite",
      "limão e ervas"
    ],
    "steps": [
      "Tempere a tilápia com limão e ervas",
      "Grelhe em frigideira antiaderente até cozinhar e desmanchar facilmente",
      "Monte a salada com verduras lavadas e regue com o azeite"
    ],
    "minutes": 20,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Escondidinho de frango com mandioquinha",
    "ingredients": [
      "1 mandioquinha média",
      "120 g de frango cozido e desfiado",
      "2 colheres (sopa) de leite",
      "1/2 tomate",
      "1 colher (chá) de azeite"
    ],
    "steps": [
      "Cozinhe a mandioquinha e amasse com o leite",
      "Refogue o frango com o tomate no azeite",
      "Coloque o frango em uma travessa, cubra com purê e aqueça no forno por 10 minutos"
    ],
    "minutes": 35,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Feijão-fradinho com legumes e ovo",
    "ingredients": [
      "1/2 xícara de feijão-fradinho cozido",
      "1 ovo cozido",
      "1/2 tomate",
      "1/4 de cebola roxa",
      "1/2 cenoura ralada",
      "limão e azeite"
    ],
    "steps": [
      "Cozinhe o ovo por cerca de 10 minutos e descasque",
      "Misture o feijão escorrido, o tomate, a cebola e a cenoura",
      "Tempere com limão e azeite e finalize com o ovo cortado"
    ],
    "minutes": 20,
    "servings": 1
  },
  {
    "category": "almoco",
    "title": "Almôndegas de frango ao molho caseiro",
    "ingredients": [
      "150 g de frango moído",
      "2 colheres (sopa) de aveia",
      "1 tomate picado",
      "1/4 de cebola",
      "alho e salsa"
    ],
    "steps": [
      "Misture frango, aveia, alho e salsa e modele pequenas almôndegas",
      "Asse a 200 °C por 20 minutos ou até cozinhar completamente",
      "Refogue cebola e tomate com um pouco de água para formar molho e envolva as almôndegas"
    ],
    "minutes": 35,
    "servings": 2
  },
  {
    "category": "almoco",
    "title": "Abobrinha recheada com quinoa e ricota",
    "ingredients": [
      "1 abobrinha grande",
      "1/2 xícara de quinoa cozida",
      "3 colheres (sopa) de ricota",
      "1/2 tomate picado",
      "orégano e azeite"
    ],
    "steps": [
      "Corte a abobrinha no sentido do comprimento e retire parte do miolo",
      "Misture quinoa, ricota, tomate e orégano e recheie as metades",
      "Regue com um fio de azeite e asse a 200 °C até amaciar, cerca de 25 minutos"
    ],
    "minutes": 35,
    "servings": 2
  },
  {
    "category": "almoco",
    "title": "Panela de frango com quiabo e tomate",
    "ingredients": [
      "150 g de peito de frango em cubos",
      "1 xícara de quiabo",
      "1 tomate",
      "1/2 cebola",
      "1 colher (chá) de azeite",
      "limão"
    ],
    "steps": [
      "Doure os cubos de frango com cebola no azeite",
      "Acrescente tomate e um pouco de água, deixando cozinhar por 10 minutos",
      "Junte o quiabo com gotas de limão e cozinhe até ficar macio e o frango bem cozido"
    ],
    "minutes": 30,
    "servings": 2
  },
  {
    "category": "almoco",
    "title": "Salada de batata com sardinha e ervas",
    "ingredients": [
      "1 batata média",
      "1 lata pequena de sardinha escorrida",
      "1/2 tomate",
      "1 colher (sopa) de iogurte natural",
      "cebolinha e limão"
    ],
    "steps": [
      "Cozinhe a batata com casca até ficar macia e corte em cubos",
      "Misture o iogurte, limão e cebolinha para formar um molho",
      "Adicione a sardinha em pedaços e o tomate e envolva delicadamente"
    ],
    "minutes": 25,
    "servings": 1
  },
  {
    "category": "jantar",
    "title": "Sopa de abóbora com gengibre",
    "ingredients": [
      "2 xícaras de abóbora picada",
      "1/4 de cebola",
      "1 dente de alho",
      "1 fatia fina de gengibre",
      "1 colher (chá) de azeite"
    ],
    "steps": [
      "Refogue cebola, alho e gengibre no azeite",
      "Junte a abóbora e água suficiente para cobrir, cozinhando até amaciar",
      "Bata com cuidado até ficar cremoso e aqueça novamente antes de servir"
    ],
    "minutes": 30,
    "servings": 2
  },
  {
    "category": "jantar",
    "title": "Creme de ervilha com hortelã",
    "ingredients": [
      "1 xícara de ervilha congelada",
      "1/4 de cebola",
      "1 xícara de água",
      "1 colher (chá) de azeite",
      "4 folhas de hortelã"
    ],
    "steps": [
      "Refogue a cebola no azeite por 2 minutos",
      "Junte as ervilhas e a água e cozinhe por 8 minutos",
      "Bata até formar creme e acrescente hortelã picada ao servir"
    ],
    "minutes": 20,
    "servings": 2
  },
  {
    "category": "jantar",
    "title": "Omelete de cogumelos e cenoura",
    "ingredients": [
      "2 ovos",
      "1/2 xícara de cogumelos fatiados",
      "1/2 cenoura ralada",
      "1 colher (chá) de azeite",
      "cebolinha e sal"
    ],
    "steps": [
      "Refogue os cogumelos e a cenoura no azeite até amaciar",
      "Bata os ovos com cebolinha e uma pitada de sal",
      "Despeje sobre os vegetais e cozinhe em fogo baixo até os ovos ficarem firmes"
    ],
    "minutes": 15,
    "servings": 1
  },
  {
    "category": "jantar",
    "title": "Salada de frango com folhas e manga",
    "ingredients": [
      "120 g de frango grelhado",
      "2 xícaras de folhas lavadas",
      "1/2 manga em cubos",
      "1/2 pepino",
      "1 colher (chá) de azeite",
      "limão"
    ],
    "steps": [
      "Grelhe e cozinhe completamente o frango e corte em tiras",
      "Distribua folhas, manga e pepino em uma travessa",
      "Acrescente frango já morno, azeite e limão e sirva"
    ],
    "minutes": 20,
    "servings": 1
  },
  {
    "category": "jantar",
    "title": "Berinjela assada com molho de tomate",
    "ingredients": [
      "1 berinjela média",
      "1 tomate maduro",
      "2 colheres (sopa) de ricota",
      "1 colher (chá) de azeite",
      "alho e orégano"
    ],
    "steps": [
      "Corte a berinjela em fatias grossas e pincele com azeite",
      "Asse a 200 °C por 20 minutos",
      "Cubra com tomate refogado, ricota e orégano e asse por mais 10 minutos"
    ],
    "minutes": 35,
    "servings": 2
  },
  {
    "category": "jantar",
    "title": "Wrap integral de homus e vegetais",
    "ingredients": [
      "1 pão tipo wrap integral",
      "3 colheres (sopa) de homus",
      "2 folhas de alface",
      "1/2 cenoura ralada",
      "1/2 pepino fatiado"
    ],
    "steps": [
      "Aqueça o wrap rapidamente em uma frigideira seca",
      "Espalhe o homus por toda a superfície",
      "Adicione vegetais lavados, enrole firme e corte ao meio"
    ],
    "minutes": 10,
    "servings": 1
  },
  {
    "category": "jantar",
    "title": "Caldo de lentilha com espinafre",
    "ingredients": [
      "3/4 de xícara de lentilha cozida",
      "1 xícara de espinafre lavado",
      "1/2 cenoura",
      "1/4 de cebola",
      "1 colher (chá) de azeite"
    ],
    "steps": [
      "Refogue a cebola e a cenoura em cubos no azeite",
      "Adicione lentilha cozida e água até obter textura de caldo",
      "Ferva por 10 minutos e finalize com espinafre até murchar"
    ],
    "minutes": 20,
    "servings": 2
  },
  {
    "category": "jantar",
    "title": "Legumes ao forno com grão-de-bico",
    "ingredients": [
      "1/2 xícara de grão-de-bico cozido",
      "1/2 abobrinha",
      "1/2 cenoura",
      "1/2 cebola",
      "1 colher (chá) de azeite",
      "alecrim"
    ],
    "steps": [
      "Corte os legumes em pedaços de tamanho semelhante",
      "Misture com grão-de-bico, azeite e alecrim",
      "Asse a 200 °C por aproximadamente 25 minutos, virando na metade do tempo"
    ],
    "minutes": 35,
    "servings": 2
  },
  {
    "category": "jantar",
    "title": "Tofu dourado com brócolis e gergelim",
    "ingredients": [
      "150 g de tofu firme",
      "1 xícara de brócolis",
      "1 colher (chá) de azeite",
      "1 colher (chá) de gergelim",
      "1 colher (chá) de molho shoyu com teor reduzido de sódio"
    ],
    "steps": [
      "Seque o tofu e corte em cubos",
      "Doure os cubos no azeite e junte o brócolis pré-cozido",
      "Tempere com pouco shoyu, aqueça bem e polvilhe gergelim"
    ],
    "minutes": 20,
    "servings": 1
  },
  {
    "category": "jantar",
    "title": "Suflê simples de couve-flor",
    "ingredients": [
      "1 xícara de couve-flor cozida",
      "2 ovos",
      "2 colheres (sopa) de leite",
      "2 colheres (sopa) de queijo branco",
      "1 pitada de noz-moscada"
    ],
    "steps": [
      "Amasse a couve-flor e misture com leite, queijo e gemas",
      "Bata as claras em neve e incorpore delicadamente",
      "Asse em refratário pequeno a 180 °C por cerca de 25 minutos até firmar e dourar"
    ],
    "minutes": 35,
    "servings": 2
  },
  {
    "category": "lanche",
    "title": "Palitos de cenoura com homus",
    "ingredients": [
      "1 cenoura grande",
      "1/2 xícara de grão-de-bico cozido",
      "1 colher (sopa) de tahine",
      "1 colher (sopa) de limão",
      "1 dente pequeno de alho"
    ],
    "steps": [
      "Lave e corte a cenoura em palitos",
      "Bata grão-de-bico, tahine, limão e alho com pouca água até ficar cremoso",
      "Sirva a pasta fria acompanhada dos palitos"
    ],
    "minutes": 10,
    "servings": 2
  },
  {
    "category": "lanche",
    "title": "Sanduíche integral de ricota com pepino",
    "ingredients": [
      "2 fatias de pão integral",
      "3 colheres (sopa) de ricota",
      "1/3 de pepino em rodelas",
      "1 colher (chá) de limão",
      "salsinha e pimenta-do-reino"
    ],
    "steps": [
      "Amasse a ricota com limão e salsinha",
      "Espalhe a pasta sobre uma fatia de pão",
      "Cubra com pepino, feche o sanduíche e corte ao meio"
    ],
    "minutes": 8,
    "servings": 1
  },
  {
    "category": "lanche",
    "title": "Maçã assada com canela e aveia",
    "ingredients": [
      "1 maçã",
      "1 colher (sopa) de aveia",
      "1 colher (chá) de uvas-passas",
      "canela a gosto",
      "2 colheres (sopa) de água"
    ],
    "steps": [
      "Retire o miolo da maçã sem atravessar o fundo",
      "Preencha com aveia, passas e canela e coloque água na travessa",
      "Asse a 180 °C por 20 a 25 minutos até amaciar"
    ],
    "minutes": 30,
    "servings": 1
  },
  {
    "category": "lanche",
    "title": "Smoothie de abacate e cacau",
    "ingredients": [
      "1/4 de abacate maduro",
      "200 ml de leite",
      "1 colher (chá) de cacau em pó sem açúcar",
      "1 banana pequena",
      "gelo a gosto"
    ],
    "steps": [
      "Coloque leite, abacate, banana e cacau no liquidificador",
      "Bata até ficar cremoso, adicionando um pouco mais de leite se necessário",
      "Sirva imediatamente com gelo"
    ],
    "minutes": 5,
    "servings": 1
  },
  {
    "category": "lanche",
    "title": "Grão-de-bico crocante ao forno",
    "ingredients": [
      "1 xícara de grão-de-bico cozido e bem escorrido",
      "1 colher (chá) de azeite",
      "1/2 colher (chá) de páprica",
      "1 pitada de sal"
    ],
    "steps": [
      "Seque muito bem o grão-de-bico com pano limpo",
      "Misture com azeite, páprica e pouco sal",
      "Asse a 200 °C por 25 a 35 minutos, mexendo duas vezes, até ficar crocante"
    ],
    "minutes": 40,
    "servings": 3
  },
  {
    "category": "lanche",
    "title": "Pipoca caseira com ervas",
    "ingredients": [
      "3 colheres (sopa) de milho para pipoca",
      "1 colher (chá) de óleo",
      "1 pitada de orégano",
      "1 pitada de sal"
    ],
    "steps": [
      "Aqueça o óleo com o milho em panela tampada",
      "Movimente a panela ocasionalmente até o estouro diminuir",
      "Transfira para uma tigela e tempere com orégano e pouco sal"
    ],
    "minutes": 10,
    "servings": 2
  },
  {
    "category": "lanche",
    "title": "Bolinho de aveia e cenoura",
    "ingredients": [
      "1 cenoura pequena ralada",
      "1 ovo",
      "4 colheres (sopa) de aveia",
      "2 colheres (sopa) de iogurte natural",
      "1 colher (chá) de fermento químico"
    ],
    "steps": [
      "Misture ovo, cenoura, aveia e iogurte em uma tigela",
      "Incorpore o fermento e divida a massa em forminhas pequenas",
      "Asse a 180 °C por 20 minutos ou até o centro ficar firme"
    ],
    "minutes": 30,
    "servings": 4
  },
  {
    "category": "lanche",
    "title": "Pasta de atum com torrada integral",
    "ingredients": [
      "1/2 lata de atum em água",
      "2 colheres (sopa) de iogurte natural",
      "1 colher (chá) de limão",
      "cebolinha a gosto",
      "3 torradas integrais"
    ],
    "steps": [
      "Escorra bem o atum e desfie com um garfo",
      "Misture com iogurte, limão e cebolinha até formar pasta",
      "Sirva com as torradas logo após preparar"
    ],
    "minutes": 8,
    "servings": 1
  },
  {
    "category": "lanche",
    "title": "Salada de frutas com iogurte",
    "ingredients": [
      "1/2 banana",
      "1/2 maçã",
      "1/2 mamão papaia",
      "3 colheres (sopa) de iogurte natural",
      "1 colher (chá) de chia"
    ],
    "steps": [
      "Lave e corte as frutas em cubos de tamanho semelhante",
      "Misture delicadamente com o iogurte",
      "Finalize com chia e mantenha refrigerado até servir"
    ],
    "minutes": 10,
    "servings": 2
  },
  {
    "category": "lanche",
    "title": "Muffin salgado de legumes",
    "ingredients": [
      "2 ovos",
      "1/2 cenoura ralada",
      "1/4 de abobrinha ralada",
      "2 colheres (sopa) de aveia",
      "1 colher (chá) de fermento",
      "cebolinha"
    ],
    "steps": [
      "Bata os ovos e misture os legumes ralados, a aveia e a cebolinha",
      "Acrescente o fermento e coloque em quatro formas de muffin",
      "Asse a 180 °C por 20 minutos até o centro estar firme"
    ],
    "minutes": 30,
    "servings": 4
  },
  {
    "category": "sobremesa",
    "title": "Banana quente com cacau e castanhas",
    "ingredients": [
      "1 banana",
      "1 colher (chá) de cacau em pó sem açúcar",
      "1 colher (sopa) de castanhas picadas",
      "canela a gosto"
    ],
    "steps": [
      "Corte a banana ao meio no sentido do comprimento",
      "Aqueça em frigideira antiaderente por 2 minutos de cada lado",
      "Polvilhe cacau e canela e finalize com castanhas"
    ],
    "minutes": 8,
    "servings": 1
  },
  {
    "category": "sobremesa",
    "title": "Mousse de abacate com limão",
    "ingredients": [
      "1/2 abacate pequeno maduro",
      "2 colheres (sopa) de iogurte natural",
      "1 colher (sopa) de suco de limão",
      "raspas de limão a gosto"
    ],
    "steps": [
      "Bata o abacate com iogurte e suco de limão até ficar cremoso",
      "Distribua em duas taças pequenas",
      "Refrigere por 30 minutos e sirva com raspas de limão"
    ],
    "minutes": 40,
    "servings": 2
  },
  {
    "category": "sobremesa",
    "title": "Picolé de iogurte com morango",
    "ingredients": [
      "1 pote de iogurte natural (170 g)",
      "1 xícara de morangos",
      "1/2 banana madura"
    ],
    "steps": [
      "Bata metade dos morangos com iogurte e banana",
      "Corte o restante dos morangos em pedaços e coloque nas formas",
      "Complete com a mistura e congele por pelo menos 4 horas"
    ],
    "minutes": 250,
    "servings": 4
  },
  {
    "category": "sobremesa",
    "title": "Pera cozida com canela",
    "ingredients": [
      "2 peras maduras",
      "1 xícara de água",
      "1 pau de canela",
      "2 cravos-da-índia",
      "1 colher (chá) de suco de limão"
    ],
    "steps": [
      "Descasque as peras e corte ao meio, retirando as sementes",
      "Cozinhe em panela com água, canela, cravo e limão por 15 minutos",
      "Espere amornar e sirva com um pouco do caldo aromático"
    ],
    "minutes": 25,
    "servings": 2
  },
  {
    "category": "sobremesa",
    "title": "Trufinha de tâmaras e cacau",
    "ingredients": [
      "8 tâmaras sem caroço",
      "3 colheres (sopa) de aveia",
      "1 colher (sopa) de cacau sem açúcar",
      "2 colheres (sopa) de água",
      "1 colher (sopa) de coco ralado sem açúcar"
    ],
    "steps": [
      "Deixe as tâmaras de molho em água morna por 10 minutos",
      "Processe as tâmaras escorridas com aveia, cacau e água até formar massa modelável",
      "Faça bolinhas, passe no coco e refrigere por 20 minutos"
    ],
    "minutes": 35,
    "servings": 8
  }
];
export const RECIPE_SECTION_LABELS:Record<Recipe["category"],string>={cafe:"Café da manhã",almoco:"Almoço",jantar:"Jantar",lanche:"Lanches",sobremesa:"Sobremesas"};
