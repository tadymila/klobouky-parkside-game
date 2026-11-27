# The Parkside

<<<<<<< HEAD
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
=======
3D sandboxová hra v prohlížeči (Three.js r128) zasazená na dvorek a do okolí Klobouk u Brna[cite: 1, 2]. Hráč střídá postavy i zvířata, plní zakázky a hlavní příběh, opravuje auta a nářadí, řeší rodinné situace i hledanost u policie[cite: 1, 2].

## 🎮 Co hra nabízí
* **Hratelné postavy a zvířata:** Pavel, Simon, Tereza a přes Terezu také psi Ashley a Jackie nebo kocour Nikísek (dále na dvorku i Boban, Mája, Milan, babička a rodiče)[cite: 1, 2].
* **Dvorek, dílna a interiéry:** Pohled z první osoby uvnitř místností (dílně, hlavním domě, Pavlově bytě, Bytu 1 i Bytu 2, skladu dílů či červeném domečku), minihry v dílně (svařování, šroubování, broušení, opravy nářadí), stavby na dvorku a živý přenos z venkovních kamer v televizi hlavního domu[cite: 1].
* **Město, doprava a ekonomika:** Ulice Klobouk u Brna a okolí (náměstí Míru, Benapol, COOP, pekárna Křížkovi, vinný sklep, hřiště, autobusová linka 109 včetně trasy do Hustopečí s Lidlem), nákupy a sortiment nářadí (včetně variant FESTA a PERFORMANCE), placené zakázky, krádeže aut, tuning u Simona a policejní pronásledování s hledaností[cite: 1].
* **Čas, počasí a ukládání:** Denní cyklus (1 den = 8 minut reálného času), proměnlivé počasí, zvuky (WebAudio a `sfx/`), ukládání postupu a velká mapa pod klávesou `M`[cite: 1, 2].

## 🕹️ Základní ovládání
* **Pohyb a akce:** `WASD` / kamera myší, `Shift` běh, `E` interakce / akce, `B` odhození předmětu/nářadí, `G` nebo klik použití nářadí[cite: 1, 2].
* **Postavy a mapa:** `Q` / `Tab` přepínání postav, `X` zvířata přes Terezu, `L` vodítko pro psy, `M` velká mapa a waypointy, `F1` legenda, `O` kvalita grafiky, `Esc` pauza[cite: 1, 2].
* **Řízení:** `W`/`S` plyn a brzda, `A`/`D` zatáčení, `Mezerník` ruční brzda, `H` troubení, `Y` rádio, `U` turbo při jízdě Simona v Golfu[cite: 1].

## 🛠️ Struktura projektu
* `index.html` – vstupní stránka a spuštění hry[cite: 1, 2]
* `game.js` – hlavní herní logika, svět, interiéry, provoz, ekonomika a rendering[cite: 1, 2]
* `characters.js` – 3D modely postav a zvířat[cite: 1, 2]
* `simon-foto.js` – fotografie zaměstnance měsíce[cite: 1]
* `sfx/` – zvukové efekty[cite: 1, 2]
* `CHANGELOG.md` – podrobný přehled úprav[cite: 1]
>>>>>>> 28a24349f26afc6c71cdac76e416d305b1e55381
