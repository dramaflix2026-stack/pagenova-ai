/** Banco separado para estética: atendimento de homens e mulheres, clínica, instrumentos e pele. */
export const tp1AestheticImages=[
 "https://images.pexels.com/photos/38167609/pexels-photo-38167609.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/6899549/pexels-photo-6899549.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446680/pexels-photo-7446680.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/16131206/pexels-photo-16131206.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/3736399/pexels-photo-3736399.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/34930097/pexels-photo-34930097.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/3736279/pexels-photo-3736279.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/30809944/pexels-photo-30809944.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/6899553/pexels-photo-6899553.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446667/pexels-photo-7446667.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/5659009/pexels-photo-5659009.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/3985361/pexels-photo-3985361.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446684/pexels-photo-7446684.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/17891765/pexels-photo-17891765.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/3736519/pexels-photo-3736519.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446665/pexels-photo-7446665.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7446677/pexels-photo-7446677.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/5069589/pexels-photo-5069589.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7108173/pexels-photo-7108173.jpeg?auto=compress&cs=tinysrgb&w=1600",
 "https://images.pexels.com/photos/7108152/pexels-photo-7108152.jpeg?auto=compress&cs=tinysrgb&w=1600",
] as const;
export function getTP1AestheticImage(slot:number):string{return tp1AestheticImages[Math.abs(Math.floor(Number.isFinite(slot)?slot:0))%tp1AestheticImages.length];}
export function recoverTP1AestheticImage(img:HTMLImageElement):void{
 const attempt=Number(img.dataset.tp1AestheticAttempt||"0");
 if(attempt>=4){img.style.visibility="hidden";return;}
 const current=tp1AestheticImages.findIndex(url=>url.split("?")[0]===img.src.split("?")[0]);
 img.dataset.tp1AestheticAttempt=String(attempt+1);
 img.src=tp1AestheticImages[(Math.max(0,current)+attempt+1)%tp1AestheticImages.length];
}
