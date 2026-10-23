export const landRadius=level=>300+60*(Math.max(1,Math.min(8,level))-1);
export function plotContains(h,x,y,padding=0){const radius=h.landRadius||300;return Math.abs(x-h.x)<=radius-padding&&Math.abs(y-h.y)<=radius-padding;}
