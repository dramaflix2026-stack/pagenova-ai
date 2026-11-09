/** Licensed Pexels editorial references (https://www.pexels.com/license/).
 * This is the universal ODONTOLOGY-only pool: do not reintroduce extreme close-ups
 * of dental tools, damaged mouths, gums or the banned Unsplash image.
 * Indexes 0..20 are independent to prevent repetition across sections.
 */
export const TP4_DENTAL_IMAGE_POOL = [
 "https://images.pexels.com/photos/37458088/pexels-photo-37458088.jpeg", // Dentista e assistente em clínica moderna
 "https://images.pexels.com/photos/37458045/pexels-photo-37458045.jpeg", // Retrato profissional odontológico
 "https://images.pexels.com/photos/11999471/pexels-photo-11999471.jpeg", // Profissional atendendo paciente
 "https://images.pexels.com/photos/37458354/pexels-photo-37458354.jpeg", // Dentista em consultório moderno
 "https://images.pexels.com/photos/3845689/pexels-photo-3845689.jpeg", // Dentista realizando atendimento
 "https://images.pexels.com/photos/3945603/pexels-photo-3945603.jpeg", // Profissionais em ambiente odontológico
 "https://images.pexels.com/photos/4297523/pexels-photo-4297523.jpeg", // Equipe odontológica com paciente
 "https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg", // Profissional e instrumentos odontológicos
 "https://images.pexels.com/photos/3881325/pexels-photo-3881325.jpeg", // Atendimento clínico profissional
 "https://images.pexels.com/photos/4269944/pexels-photo-4269944.jpeg", // Cena de atendimento odontológico
 "https://images.pexels.com/photos/14458273/pexels-photo-14458273.jpeg", // Paciente sorrindo em consulta
 "https://images.pexels.com/photos/3845981/pexels-photo-3845981.jpeg", // Equipe de dentistas em consultório
 "https://images.pexels.com/photos/4297520/pexels-photo-4297520.jpeg", // Profissional em procedimento
 "https://images.pexels.com/photos/5622010/pexels-photo-5622010.jpeg", // Dentista no consultório
 "https://images.pexels.com/photos/3884090/pexels-photo-3884090.jpeg", // Dentista em clínica moderna
 "https://images.pexels.com/photos/19976592/pexels-photo-19976592.jpeg", // Atendimento odontológico
 "https://images.pexels.com/photos/37458147/pexels-photo-37458147.jpeg", // Dentista em consultório
 "https://images.pexels.com/photos/3952130/pexels-photo-3952130.jpeg", // Atendimento odontológico preventivo
 "https://images.pexels.com/photos/19976577/pexels-photo-19976577.jpeg", // Clínica odontológica e profissional
 "https://images.pexels.com/photos/19332231/pexels-photo-19332231.jpeg", // Dentista e paciente em consultório
 "https://images.pexels.com/photos/4269934/pexels-photo-4269934.jpeg", // Cuidado odontológico
] as const;
export const TP4_DENTAL_GALLERY_IMAGES=TP4_DENTAL_IMAGE_POOL.slice(2,8);
export const TP4_DENTAL_TEAM_IMAGES=[TP4_DENTAL_IMAGE_POOL[15],TP4_DENTAL_IMAGE_POOL[16],TP4_DENTAL_IMAGE_POOL[18],TP4_DENTAL_IMAGE_POOL[19]] as const;
export const tp4DentalImage=(index:number,width=1400)=>{
 const path=TP4_DENTAL_IMAGE_POOL[index%TP4_DENTAL_IMAGE_POOL.length];
 return path+"?auto=compress&cs=tinysrgb&w="+width;
};
