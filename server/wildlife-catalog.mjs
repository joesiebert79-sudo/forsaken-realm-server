// Species/design identity comes from the exact approved wildlife sheet.
// Numbers are draft playtest balance, not approved prices or biological measurements.
export const HARVEST_QUALITY=Object.freeze({damaged:.5,common:1,fine:1.5,pristine:2.5,exceptional:4});
const groups={
 forest:[['deer','Deer','venison','hide','antler'],['doe','Doe','venison','hide'],['fawn','Fawn'],['elk','Elk','elkMeat','hide','antler'],['wildBoar','Wild Boar','boarMeat','hide','tusk'],['fox','Fox','gameMeat','fur','tooth'],['rabbit','Rabbit','rabbitMeat','fur'],['squirrel','Squirrel','gameMeat','fur'],['badger','Badger','gameMeat','fur','claw'],['raccoon','Raccoon','gameMeat','fur']],
 mountain:[['mountainGoat','Mountain Goat','mutton','hide','horn'],['ibex','Ibex','mutton','hide','horn'],['bighornSheep','Bighorn Sheep','mutton','hide','horn'],['bear','Bear','bearMeat','pelt','claw'],['snowBear','Snow Bear','bearMeat','pelt','claw'],['wolf','Wolf','gameMeat','pelt','tooth'],['snowWolf','Snow Wolf','gameMeat','pelt','tooth'],['lynx','Lynx','gameMeat','fur','claw'],['mountainLion','Mountain Lion','gameMeat','pelt','claw']],
 plains:[['bison','Bison','bisonMeat','thickHide','horn'],['cow','Cow','beef','hide','horn'],['bull','Bull','beef','hide','horn'],['horse','Horse','horseMeat','hide'],['wildHorse','Wild Horse','horseMeat','hide'],['plainsElk','Elk (Plains)','elkMeat','hide','antler'],['antelope','Antelope','venison','hide','horn'],['pronghorn','Pronghorn','venison','hide','horn'],['coyote','Coyote','gameMeat','pelt','tooth'],['prairieDog','Prairie Dog','gameMeat','fur']],
 wetland:[['beaver','Beaver','gameMeat','fur','tooth'],['otter','Otter','gameMeat','fur'],['muskrat','Muskrat','gameMeat','fur'],['duck','Duck','duckMeat','feather'],['goose','Goose','gooseMeat','feather'],['crane','Crane','birdMeat','feather'],['heron','Heron','birdMeat','feather'],['turkey','Turkey','turkeyMeat','feather']],
 river:[['trout','Trout','troutFillet'],['salmon','Salmon','salmonFillet'],['pike','Pike','pikeFillet'],['bass','Bass','bassFillet'],['catfish','Catfish','catfishFillet']],
 desert:[['cougar','Cougar','gameMeat','pelt','claw'],['bobcat','Bobcat','gameMeat','fur','claw'],['javelina','Javelina','boarMeat','hide','tusk'],['desertBighorn','Desert Bighorn','mutton','hide','horn'],['roadrunner','Roadrunner','birdMeat','feather'],['rattlesnake','Rattlesnake','gameMeat','snakeSkin','fang'],['lizard','Lizard','gameMeat','snakeSkin'],['scorpion','Scorpion',null,'chitin','venom']],
 rare:[['moose','Moose','mooseMeat','thickHide','antler'],['blackBear','Black Bear','bearMeat','pelt','claw'],['albinoDeer','Albino Deer','venison','albinoHide','antler'],['redFox','Red Fox','gameMeat','redFur','tooth'],['goldenEagle','Golden Eagle','birdMeat','eagleFeather','claw']]
};
const predators=new Set(['fox','badger','bear','snowBear','wolf','snowWolf','lynx','mountainLion','coyote','cougar','bobcat','blackBear','redFox','goldenEagle']);
const defensive=new Set(['wildBoar','javelina','elk','plainsElk','moose','bison','mountainGoat','ibex','bighornSheep','desertBighorn','rattlesnake','scorpion']);
const domestic=new Set(['cow','bull','horse']);
const small=new Set(['fawn','rabbit','squirrel','prairieDog','muskrat','duck','goose','crane','heron','turkey','roadrunner','rattlesnake','lizard','scorpion']);
const large=new Set(['elk','plainsElk','moose','bison','bear','snowBear','blackBear','cow','bull','horse','wildHorse']);
export const WILDLIFE_SPECIES=Object.freeze(Object.fromEntries(Object.entries(groups).flatMap(([referenceBiome,rows])=>rows.map(([id,name,meat,coat,trophy])=>{
 const fish=referenceBiome==='river',juvenile=id==='fawn',size=small.has(id)?1:large.has(id)?3:2;
 const biomes=referenceBiome==='rare'?({moose:['forest','wetland'],blackBear:['forest','mountain'],albinoDeer:['forest','plains'],redFox:['forest','plains'],goldenEagle:['mountain','plains']}[id]):[referenceBiome];
 const yields={};if(!juvenile){if(meat)yields[meat]=fish?2:size*2;if(coat)yields[coat]=coat.includes('Feather')||coat==='feather'?4:1;if(trophy)yields[trophy]=1;if(!fish&&id!=='scorpion')Object.assign(yields,{bone:size,fat:size,sinew:1});if(fish)yields.roe=1;}
 return [id,Object.freeze({id,name,referenceBiome,biomes,fish,juvenile,domestic:domestic.has(id),huntable:!juvenile&&!domestic.has(id),temperament:predators.has(id)?'predator':defensive.has(id)?'defensive':'cautious',size,maxHp:size*35,speed:fish?55:small.has(id)?170:130,hearing:160,sight:200,scent:240,spawnWeight:referenceBiome==='rare'?.05:1,schedule:predators.has(id)?'crepuscular':'diurnal',yields:Object.freeze(yields),balanceStatus:'draft-playtest'})];
}))));
// The approved plains row depicts and labels Coyote twice; that is one species,
// retained as two reference occurrences rather than inventing a second animal.
export const WILDLIFE_REFERENCE_OCCURRENCES=Object.freeze(Object.entries(groups).flatMap(([biome,rows])=>rows.map(([id])=>({biome,id}))).concat({biome:'plains',id:'coyote'}));
export const BIOME_SPAWNS=Object.freeze(Object.fromEntries(['forest','mountain','plains','wetland','river','desert'].map(biome=>[biome,Object.values(WILDLIFE_SPECIES).filter(s=>!s.domestic&&s.biomes.includes(biome)).map(s=>({species:s.id,weight:s.spawnWeight}))])));
