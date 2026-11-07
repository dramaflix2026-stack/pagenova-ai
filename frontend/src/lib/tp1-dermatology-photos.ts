/** Dermatology only: clinically relevant skincare and health photography from the internet.
 * Avoids TP1's generic fashion/editorial image pool. No fictitious clinic/patient claims.
 * Slot order: hero, concept, services, journey, gallery, testimonial, contact, history.
 */
export const dermatologyInternetPhotos = [
  "https://images.pexels.com/photos/5659049/pexels-photo-5659049.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=85",
  "https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/5069589/pexels-photo-5069589.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1600&q=85",
  "https://images.pexels.com/photos/6899549/pexels-photo-6899549.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85",
  "https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1600&q=85",
  "https://images.pexels.com/photos/7446667/pexels-photo-7446667.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1600&q=85",
  "https://images.pexels.com/photos/5659009/pexels-photo-5659009.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1617213226302-99a82b62626f?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1576091160451-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1611930022073-84f6b1f1c9b7?auto=format&fit=crop&w=1600&q=85"
] as const;
export function getDermatologyInternetPhoto(slot:number):string {
  const index=Number.isFinite(slot)?Math.max(0,Math.floor(slot)):0;
  return dermatologyInternetPhotos[index%dermatologyInternetPhotos.length];
}
