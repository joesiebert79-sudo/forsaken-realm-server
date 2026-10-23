import {coinValue} from './currency.mjs';

// Pay one quarter of the catalog value, rounded down only after totaling the
// entire sale. Splitting a stack never earns more than selling it together.
export function sellBackTotal(amount,currency,quantity=1){
 if(!Number.isSafeInteger(quantity)||quantity<0)throw Error('Invalid sale quantity');
 const total=coinValue(amount,currency)*BigInt(quantity)/4n;
 if(total>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Sale value is too large');
 return Number(total);
}
export function sellBackQuotes(amount,currency,count){
 if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid inventory quantity');
 return Array.from({length:Math.min(100,count)+1},(_,quantity)=>sellBackTotal(amount,currency,quantity));
}
