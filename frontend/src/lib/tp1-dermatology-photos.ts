/** Dermatologia: fotografias verificadas de cuidado da pele, dermatoscopia e consulta.
 * Somente Pexels, imagens licenciadas para uso gratuito. Nenhuma foto representa
 * a clínica ou um paciente real dela; slots são independentes entre seções.
 * Hero 0 · serviços 1–4 · sobre 5 · etapas 6–8 · galeria 9–14 ·
 * experiências 15 · contato 16 · trajetória 17–20 · reservas 21–23.
 */
export const dermatologyInternetPhotos=[
  "https://images.pexels.com/photos/7446661/pexels-photo-7446661.jpeg?auto=compress&cs=tinysrgb&w=1600", // Dermatoscopia e exame da pele
  "https://images.pexels.com/photos/7446660/pexels-photo-7446660.jpeg?auto=compress&cs=tinysrgb&w=1600", // Diagnóstico e avaliação com dermatoscópio digital
  "https://images.pexels.com/photos/7446680/pexels-photo-7446680.jpeg?auto=compress&cs=tinysrgb&w=1600", // Tratamento de pele com profissional
  "https://images.pexels.com/photos/7446684/pexels-photo-7446684.jpeg?auto=compress&cs=tinysrgb&w=1600", // Consulta e acompanhamento com tablet
  "https://images.pexels.com/photos/40594081/pexels-photo-40594081.jpeg?auto=compress&cs=tinysrgb&w=1600", // Exame de couro cabeludo com dermatoscópio
  "https://images.pexels.com/photos/7108173/pexels-photo-7108173.jpeg?auto=compress&cs=tinysrgb&w=1600", // Dermatologista avaliando paciente
  "https://images.pexels.com/photos/7446663/pexels-photo-7446663.jpeg?auto=compress&cs=tinysrgb&w=1600", // Atendimento médico e acolhimento
  "https://images.pexels.com/photos/7446672/pexels-photo-7446672.jpeg?auto=compress&cs=tinysrgb&w=1600", // Avaliação dermatológica e equipamento
  "https://images.pexels.com/photos/7446690/pexels-photo-7446690.jpeg?auto=compress&cs=tinysrgb&w=1600", // Cuidados realizados por profissional
  "https://images.pexels.com/photos/7446683/pexels-photo-7446683.jpeg?auto=compress&cs=tinysrgb&w=1600", // Tratamento dermatológico em clínica
  "https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=1600", // Procedimento de cuidado da pele
  "https://images.pexels.com/photos/5622022/pexels-photo-5622022.jpeg?auto=compress&cs=tinysrgb&w=1600", // Exame clínico dermatológico
  "https://images.pexels.com/photos/7446665/pexels-photo-7446665.jpeg?auto=compress&cs=tinysrgb&w=1600", // Cuidado da pele em ambiente clínico
  "https://images.pexels.com/photos/7108152/pexels-photo-7108152.jpeg?auto=compress&cs=tinysrgb&w=1600", // Avaliação e acompanhamento médico
  "https://images.pexels.com/photos/7446669/pexels-photo-7446669.jpeg?auto=compress&cs=tinysrgb&w=1600", // Análise profissional da pele
  "https://images.pexels.com/photos/3985361/pexels-photo-3985361.jpeg?auto=compress&cs=tinysrgb&w=1600", // Procedimento clínico de cuidados da pele
  "https://images.pexels.com/photos/7108335/pexels-photo-7108335.jpeg?auto=compress&cs=tinysrgb&w=1600", // Consulta em ambiente clínico
  "https://images.pexels.com/photos/7446677/pexels-photo-7446677.jpeg?auto=compress&cs=tinysrgb&w=1600", // Procedimento facial e cuidado
  "https://images.pexels.com/photos/5659009/pexels-photo-5659009.jpeg?auto=compress&cs=tinysrgb&w=1600", // Cuidado facial por profissional
  "https://images.pexels.com/photos/5563658/pexels-photo-5563658.jpeg?auto=compress&cs=tinysrgb&w=1600", // Preparo e biossegurança
  "https://images.pexels.com/photos/6977986/pexels-photo-6977986.jpeg?auto=compress&cs=tinysrgb&w=1600", // Aplicação de tratamento de pele
  "https://images.pexels.com/photos/6811386/pexels-photo-6811386.jpeg?auto=compress&cs=tinysrgb&w=1600", // Rotina de cuidados com a pele
  "https://images.pexels.com/photos/7622934/pexels-photo-7622934.jpeg?auto=compress&cs=tinysrgb&w=1600", // Cuidados cotidianos com a pele
  "https://images.pexels.com/photos/7622889/pexels-photo-7622889.jpeg?auto=compress&cs=tinysrgb&w=1600", // Cuidados e proteção da pele
] as const;
export function getDermatologyInternetPhoto(slot:number):string{
  return dermatologyInternetPhotos[Math.max(0,Math.floor(Number.isFinite(slot)?slot:0))%dermatologyInternetPhotos.length];
}
/** Try other clinical photos if a third-party image URL becomes unavailable. */
export function recoverDermatologyPhoto(img:HTMLImageElement):void{
  const attempt=Number(img.dataset.dermatologyFallbackAttempt||"0");
  if(attempt>=3){img.style.visibility="hidden";return;}
  const current=dermatologyInternetPhotos.findIndex(url=>url.split("?")[0]===img.src.split("?")[0]);
  const next=current<0?attempt:(current+1)%dermatologyInternetPhotos.length;
  img.dataset.dermatologyFallbackAttempt=String(attempt+1);
  img.src=dermatologyInternetPhotos[next];
}
