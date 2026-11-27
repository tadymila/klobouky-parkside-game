# The Parkside

3D hra do prohlížeče (Three.js r128), kamera ze třetí osoby.

## Postavy
- **Pavel** – kutil s dílnou na dvorku, vyrábí věci ze dřeva (minihry: řezání, vrtání, šroubování, natírání).
- **Tereza** – kudrnatá holka, cvičí agility se psy.
- **Ashley** – border kolie blue merle, jedno oko modré a jedno hnědé.
- **Jackie** – zlatorezavá border kolie s bílou lysinkou.
- **Nikísek** – mainský mývalí kocour, chodí po střechách.
- **Mája** – mainská mývalí kočka, občas proběhne dvorem.
- **Milan** – bydlí v Bytě 1, hlavně v noci nosí bedny dřeva do hlavního domu.
- **Boban** – černo-pálený jezevčík, otrava celé hry, nejde vyhnat (buřt ho uklidní na cca 20 s).

## Koncept: Závody v neděli
Týden po dnech: Pavel vyrobí překážku → Tereza na ní trénuje psy → body na lepší nářadí → v neděli finálový závod.

## Soubory
- `index.html` – náhled postav (otevři v prohlížeči)
- `characters.js` – 3D modely postav, sdílené pro celou hru
- `game.js` – dvorek, ovládání, AI psů a Bobana, zvuky
- `postavy.html` – náhled postav
- `sfx/` – zvuky z ElevenLabs (`presun-zvuky.ps1` je sem přesune ze Stažených souborů)

## Stav
- [x] Postavy
- [x] Dvorek podle plánku
- [x] Chození za Pavla / Terezu
- [x] Zvuky (kroky, štěkání, ambient)
- [x] Úpravy mapy podle screenshotů (dům do U, průchod ve zdi, rajčata, dřevník, kompost, sousedi s balkonem, autodíly, tunel)
- [x] Ponožka na Bobana (T, 60 s klidu, pak záchvat)
- [x] Goofy hudba podle situace (dvorek / dílna / trénink / Boban / klid)
- [x] Jackie se pořád chce mazlit (E = pomazlit)
- [x] Kočky: Nikísek chodí po střechách, Mája občas proběhne (psi ji honí)
- [x] Vrakoviště (šedá zem, ~28 nárazníků, 10 dveří, stojan se skly, 8 V8 motorů v regálu)
- [x] Budova s Bytem 2 protažená na sever, vyvýšený chodník s ní
- [x] Pergola přes celý dvorek, zahrádka u schodů k Bytu 1, nová fasáda, zeď s brankou, oboustranná cedule
- [x] Dílna jako samostatná scéna: 16 nářadí na výběr, 2 ponky, sedačka z auta, hifi, SPZ
- [x] Boban: méně štěká, leze pod nohy, krade nářadí, dá se odkopnout (F)
- [x] Psi skáčou na schody a chodník
- [x] Ashley pořád něco sbírá ze země a žere
- [x] Psi zklidnění: Boban se plete pod nohy jen občas (každých 30–50 s na 6 s), méně štěká a krade, Ashley a Jackie klidnější
- [x] Den a noc (1 den = 8 min), Milan v noci nosí dřevo z dřevníku do domu
- [x] Dílna menší a tmavší: nářadí na stěně, 3 sedačky z Jeepu Cherokee 2.8 CRD (2007), stůl 1 + stůl 2, repráky ve 4 rozích s elektrovedením, SPZ; psi dovnitř nesmí; vlastní hudba (garážový rock)
- [x] Pavlův byt: tma, elektrika v procesu, svítí jen baterka
- [x] Večer (19:00) psi zalezou domů, ráno (7:00) vylezou; v noci se honí Nikísek s Májou
- [x] Milan kolem 18:00 nosí dřevo do hlavního domu (vchod pod pergolou)
- [x] Pergola s průhlednou jednospádovou střechou
- [x] Nové zvuky: bruska, přímočará pila, příklepovka, hoblík, metr, mňoukání, kočky, kňučení, žraní, ponožka, kopnutí, bedna, vrčení, sedačka, noční ambient
- [x] 22:00 všichni jdou spát (Tereza do Bytu 1, Pavel do svého bytu), o půlnoci pauza se shrnutím dne a tlačítko Probudit se ráno
- [x] Víc místa před dílnou (dílna, venkovní dílna, Pavlův byt a horní zeď posunuty o 2,5 m na sever), Pavlův byt větší zvenku i uvnitř
- [x] Zeď až k domu, vyvýšený chodník končí u zdi, boční schody u branky, dveře Bytu 2 severněji
- [x] Dílna vyšperkovaná: šedá podlaha, okno u stolu 1, regál, police, šuplíkový vozík, kufry, bordel, kabely všude; 22 nástrojů s nápisem PARKSIDE + řada PARKSIDE PERFORMANCE
- [x] Budova s byty končí u zdi, západní křídlo protaženo na sever do stejné linie
- [x] Sloupové lampy jen u zahrádky a na chodníku, ostatní světla nad dveřmi domů
- [ ] Minihry v dílně + první překážka (laťka)
- [x] Boban AI (základ)


## Výběr postavy (Claude)
Start hry je výběr postavy. Začíná se Pavlem, Simon a Tereza se odemknou po prvním použití nářadí v dílně. Q = Pavel → Simon → Tereza, X za Terezu = Ashley → Nikísek → Tereza. Dole je vždy lišta s úkolem.


## Ovládání a systémy (Claude, 2026-11-27)
- E: akce (dveře, brána, garáž, auto, regály ve skladu dílů, zvednout věc), B: odhodit nářadí / díl, G nebo klik: použít nářadí, Q: přepnout postavu, X: zvíře přes Terezu, R: vyprostit, J: přeskočit čas.
- Auto: po dokončení Simonova tuningu E u auta → W/S plyn/brzda, A/D zatáčení, E vystoupit. Brána v severní zdi se otvírá E.
- Interiéry: Dílna, Pavlův byt, Byt 1 (Tereza), Byt 2 (prádelna → sklady → Masarykova), Hlavní dům (zatím prázdný), Sklad dílů (po žebříku u vrakoviště).
- Fotka zaměstnance měsíce: `simon-foto.js` (`window.SIMON_PHOTO`), jinak E u rámečku v dílně.
