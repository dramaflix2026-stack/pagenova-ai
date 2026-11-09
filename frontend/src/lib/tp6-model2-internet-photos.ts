/** External editorial imagery for TP6 Model 02. Never reads the PageNova media bank. */
const photoIds:Record<string,string[]>={
  "Loja de roupas": [
    "1445205170230-053b83016050",
    "1483985988355-763728e1935b",
    "1490481651871-ab68de25d43d",
    "1509631179647-0177331693ae",
    "1539109136881-3be0616acf4b",
    "1529139574466-a303027c1d8b",
    "1515886657613-9f3515b0c78f",
    "1483985988355-763728e1935b",
    "1483985988355-763728e1935b",
    "1496747611176-843222e1e57c",
    "1525507119028-ed4c629a60a3",
    "1469334031218-e382a71b716b",
    "1483985988355-763728e1935b"
  ],
  "Loja de calçados": [
    "1549298916-b41d501d3772",
    "1525966222134-fcfa99b8ae77",
    "1600185365483-26d7a4cc7519",
    "1608231387042-66d1773070a5"
  ],
  "Joalheria e semijoias": [
    "1515562141207-7a88fb7ce338",
    "1611652022419-a9419f74343d",
    "1535632066927-ab7c9ab60908",
    "1605100804763-247f67b3557e"
  ],
  "Ótica": [
    "1511499767150-a48a237f0083",
    "1574258495973-f010dfbb5371",
    "1473496169904-658ba7c44d8a",
    "1517841905240-472988babdf9"
  ],
  // Independently sourced Unsplash images with verified themes; each group is
  // perfume, skincare, makeup/beauty and mixed cosmetic products respectively.
  "Perfumaria e cosméticos": [
    "1541643600914-78b084683601", // perfume bottle
    "1741896136288-b04426b65558", // serum droppers
    "1596462502278-27bfdc403348", // cosmetics
    "1591375462355-a219af30bf16", // perfume and makeup flatlay
    "1594035910387-fea47794261f", // perfume bottle
    "1608248597279-f99d160bfcbc", // skincare cream
    "1688955665338-fb430ff8436d", // makeup and perfume flatlay — Harper Sunday, Unsplash
    "1617213226302-99a82b62626f", // perfume and beauty
    "1718466044521-d38654f3ba0a", // perfume display
    "1556228720-195a672e8a03", // skin care cleanser
    "1571781926291-c477ebfd024b", // vitamin C serum
    "1671155029278-84891edf0a19" // perfume, skincare and makeup
  ],
  // Curadoria por categoria: acessórios (coleira/guia), conforto (caminha),
  // brinquedos (cachorro brincando) e favoritos (ração).
  "Pet shop": [
    "1577447278822-37801be21738",
    "1657414066378-12c1523b9701",
    "1589924749359-9697080c3577",
    "1764249453850-faace6e57444"
  ],
  "Loja de eletrônicos": [
    "1498049794561-7780e7231661",
    "1518770660439-4636190af475",
    "1523275335684-37898b6baf30",
    "1550009158-9ebf69173e03"
  ],
  "Loja de celulares e acessórios": [
    "1511707171634-5f897ff02aa9",
    "1592750475338-74b7b21085ab",
    "1603891128711-11b4b03bb138",
    "1512941937669-90a1b58e7e9"
  ],
  "Loja de móveis e decoração": [
    "1555041469-a586c61ea9bc",
    "1494438639946-1ebd1d20bf85",
    "1600210492486-724fe5c67fb0",
    "1616486338812-3dadae4b4ace"
  ],
  "Floricultura": [
    "1490750967868-88aa4486c946",
    "1457089328109-e5d9bd499191",
    "1526045478516-99145907023c",
    "1561181286-d3fee7d55364",
    "1487530811176-3780de880c2d",
    "1468327768560-75b778cbb551",
    "1508615070457-7baeba4003ab",
    "1455659817273-f96807779a8a"
  ],
  "Papelaria": [
    "1455390582262-044cdead277a",
    "1531346878377-a5be20888e57",
    "1512820790803-83ca734da794",
    "1506784983877-45594efa4cbe"
  ],
  "Loja de brinquedos": [
    "1558060370-d644479cb6f7",
    "1515488042361-ee00e0ddd4e4",
    "1596464716127-f2a82984de30",
    "1566576912321-d58ddd7a6088"
  ],
  "Loja de artigos esportivos": [
    "1517836357463-d25dfeac3438",
    "1534438327276-14e5300c3a48",
    "1571019613454-1cb2f99b2d8b",
    "1518611012118-696072aa579a"
  ],
  "Loja de presentes e personalizados": [
    "1513201099705-a9746e1e201f",
    "1549465220-1a8b9238cd48",
    "1490312278390-ab64016e0aa9",
    "1513519245088-0e12902e5a38"
  ],
  "E-commerce multimarcas": [
    "1441986300917-64674bd600d8",
    "1542838132-92c53300491e",
    "1498049794561-7780e7231661",
    "1555041469-a586c61ea9bc"
  ]
};
export function getTP6Model2InternetPhotos(niche:string, variant:"01"|"02"|"03"="02"):string[]{
  const pool=[...new Set(photoIds[niche]||photoIds["E-commerce multimarcas"])];
  // Each model receives its own deterministic editorial selection. For short niche
  // catalogs, rotate the order without inventing URLs or using the PageNova bank.
  const start=variant==="01"?0:variant==="02"?4:8;
  const selected=(niche==="Perfumaria e cosméticos"||niche==="Floricultura")?Array.from({length:8},(_,i)=>pool[(start+i)%pool.length]):Array.from({length:Math.min(4,pool.length)},(_,i)=>pool[(start+i)%pool.length]);
  return selected.map(id=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`);
}

/** Client-side recovery when an external perfume photo is removed or blocked. */
const perfumeFallbackPhotos=[
  "1688955665338-fb430ff8436d", // cosmetics, makeup and perfume flatlay
  "1594035910387-fea47794261f", // perfume
  "1608248597279-f99d160bfcbc", // skincare
  "1617213226302-99a82b62626f", // perfume and beauty
  "1541643600914-78b084683601" // perfume bottle
].map(id=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`);
export function handleTP6RetailImageError(img:HTMLImageElement,niche:string,slot=0):void{
  if(niche!=="Perfumaria e cosméticos")return;
  const offset=Number(img.dataset.tp6FallbackAttempt||"0");
  for(let attempt=offset;attempt<perfumeFallbackPhotos.length;attempt++){
    const backup=perfumeFallbackPhotos[(slot+attempt)%perfumeFallbackPhotos.length];
    img.dataset.tp6FallbackAttempt=String(attempt+1);
    if(img.src.split("?")[0]===backup.split("?")[0])continue;
    img.src=backup;
    return;
  }
  // Hide the browser's broken-image icon and alt overlay if all hosts fail.
  img.style.visibility="hidden";
}
