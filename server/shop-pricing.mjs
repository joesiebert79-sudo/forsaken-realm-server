import {ITEMS} from './catalog.mjs';
export function offerPrice(offer){const item=ITEMS[offer.item],rarity=item?.rarity||4;return {amount:offer.gold,currency:offer.currency|| (item?(rarity>=4?'gold':rarity>=2?'silver':'copper'):'gold')};}
export const priceText=offer=>{const p=offerPrice(offer);return `${p.amount} ${p.currency}`;};
