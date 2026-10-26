/**
 * A dark/photo-based immersive hero requires a readable color by default.
 * Explicit customer color changes take precedence over the automatic choice.
 */
export function immersiveHeroTextColor(
  value:string|undefined,
  immersive:boolean,
  customerSelected:boolean|undefined
):string|undefined {
  if(immersive&&!customerSelected)return "#FFFFFF";
  return value;
}
