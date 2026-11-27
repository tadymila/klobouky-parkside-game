# The Parkside – changelog

## 2026-11-27 – ChatGPT – FESTA, kamery, Simonův Golf a rodina

- Změněné soubory: game.js, index.html a CHANGELOG.md. Miloš prodává místní varianty celého sortimentu Lidl včetně variant PERFORMANCE a kompresoru. Část cen se denně střídá. F1 otevírá legendu, U přidává turbo při jízdě Simona v Golfu.
- Kamery na rozích domů mají živý přenos v televizi hlavního domu. Luboš může při odpolední návštěvě sebrat skutečné nářadí, televizní záznam umožní získat ho zpět. Táta má nové placené zakázky a občas daruje peníze. Máma kontroluje výhled na Pavla i Bobana a při spatřeném kopnutí polsky vynadá a odebere nejvýše 200 Kč.
- Ověření: node --check game.js, spuštění v Edge a otevření F1. Samostatný test v Edge prošel pro katalog FESTA, regál, odcizení, kamerové menu, vrácení předmětu a výhled mámy před ní, za ní a přes zeď.
- Zbývá ruční jízda s turbem, kontrola kompozice kamer v ulicích a průchod novými úkoly během běžného hraní.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - náměstí Míru podle tří fotografií

- Soubory: game.js, CHANGELOG.md. Rozšířený betonový přístřešek zastávky, prosklení, lavičky, jízdní řády, lampy a označení 109. Benapol má červený fasádní nápis, markýzu, výlohy a taškovou střechu. Doplněny vějíře dlažby, parkovací zálivy a stromy v mřížích. Hospoda přesunuta z překryvu s veřejnou budovou, včetně vstupu a návratu.
- Ověření: headless Edge načetl hru a přešel přes Hrát do herních snímků. Po dokončení vzoru dlažby prošel node --check. Zbývá vizuální porovnání ve hře z úhlů referenčních fotografií.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - oprava spuštění hry

- Soubory: game.js, index.html, CHANGELOG.md. Při generování parkovaných aut se před inicializací volala funkce pick, což přerušilo start. Funkce je nyní dostupná před prvním voláním. Hlavní stránka používá přibalené Three.js r128.
- Ověření: původní ReferenceError reprodukován v Edge. Po opravě proběhlo načtení lokální hry, kliknutí na Hrát a následující animační snímky bez zachycené chyby. node --check game.js prošel. Pro nahlášený pád nic nezbývá.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - průjezd od Krátké a Simonův Golf

- Soubory: game.js, CHANGELOG.md. Dům zasahující přes Masarykovu za ústím Krátké byl odsazen od jízdních pruhů. Místní řady domů respektují ochranný pás všech tří ulic, generované městské domy i vlastní diagonální rozměr. Golf vyjíždí středem průjezdu, při návratu i odjezdu kontroluje překážky.
- Ověření: node --check; test překryvu původního a nového domu a odstupu Golfu u opravené křižovatky v obou směrech. Zbývá zkušební jízda ve 3D.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - Bobanova panička, prodavač a linka 109

- Soubory: game.js, CHANGELOG.md. Máma chodí na dvorek v 9 a 16 hodin, volá Bobana na granule a komentuje Pavla. Boban přiběhne a vrtí ocasem. Luboš brousí od 10 do 17 hodin. Ve stavebninách je samostatný prodavač a označený regál FESTA s modely nářadí.
- Městská parkovací místa se vytvářejí podél krajnice místo v pásu, ve kterém se generují domy. Přidána kontrola odstupu od celého půdorysu včetně rohů domů. Linka 109 z náměstí jede každou celou do herního Hornbachu, má nákup materiálu a návrat do Klobouk.
- Ověření: node --check game.js a izolovaný test zastavení a nástupu v každé z 24 hodin. Zbývá vizuální kontrola parkování, NPC a celé cesty v prohlížeči.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - obytné buňky, prodej kořisti a parkování

- Soubory: game.js, CHANGELOG.md. B1–B4 mají dveře a samostatné interiéry s palandami, nepořádkem a sedícími zloději. Úspěšný zloděj nese skutečně ukradený předmět ke kupci na ulici. U domu přibyli pěší a postávající sousedé.
- Parkování kontroluje celý obdélník vozu proti budovám, pevným překážkám a zaparkovaným vozům. Městská auta se staví podélně podle strany silnice.
- Ověření: node --check, izolovaný test přesahu rohu karoserie, otočeného auta a dokončení prodeje. Zbývá vizuální kontrola vygenerovaných ulic, dveří a trasy zloděje.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - obchody, Luboš, pošta a donate

- Soubory: game.js, CHANGELOG.md. Benapol a stavebniny mají průchozí interiéry s odlišnými regály, před stavebninami jsou hromady písku, štěrku, drti a dřevo. Luboš pracuje ve skladu a chodí do Pavlova bytu brousit trám. Krádež ze skladu je nezávislá na hráčově nákupu.
- Nevyzvednuté doručené objednávky čekají na poště vedle Benapolu. Donate Pavlovi činí 500 Kč jednou za dva herní dny.
- Ověření: node --check game.js, izolovaný test změny zůstatku, ochrany proti dvojí výplatě, přímého předání a vyzvednutí na poště. Zbývá projít interiéry a Lubošovu trasu ve 3D.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - náměstí Míru, Lidl, stavebniny a tankování

- Soubory: game.js, index.html, CHANGELOG.md. Podle dodaných referencí změněna fasáda Benapolu, dlažba, veřejná budova a krytá čekárna. Lidl má prosklený vstup s markýzou, parkovací řady a v okolí polikliniku a bazény.
- Benapol prodává jídlo. Materiál a elektro prodává Miloš Vlček u vinných sklepů. Herní postava Luboš nabízí nářadí FESTA a spojovací materiál, někdy si schová jeden kus. Zakázka na výrobu stolu má výkres, spotřebu materiálu a odměnu.
- Stojan nabízí tankování Babety směsí s 2T olejem, plnou i s rezervním kanystrem a nákup směsi z auta. Ze stanice odstraněna černá geometrie s nulovou výškou.
- Ověření: node --check, izolovaný test obou způsobů nákupu paliva a kontrola propojení obchodů a výkresu. Zbývá vizuální kontrola v prohlížeči, zejména původního černého artefaktu.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - kanystry na Babety

- Soubory: game.js, CHANGELOG.md. U obou stojanů BENZINA v Kloboukách je plný 5l kanystr za 190 Kč. Postava jej veze v inventáři a u Babety přes E dolije nádrž. Prázdná nádrž zastaví motor. Nákup a dolití se ukládají.
- Ověření: node --check a izolovaná kontrola zastavení, nákupu, dolití a dvojitého kliknutí. Zbývá projet trasu v prohlížeči.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - doručení nářadí a hustopečská zastávka

- Soubory: game.js, CHANGELOG.md. Přímý nákup se ukládá ihned, pošťák předává i bez přítomnosti hráče, kompresor dostal model a místo na stěně. Zaplacenou objednávku nelze duplicitně koupit v prodejně.
- Autobus v Hustopečích stojí na silnici vedle parkoviště s cílem Klobouky. Výstup na obou koncích kontroluje kolize a prostor pro první kroky, opakovaný stisk během přechodu nestrhává druhé jízdné.
- Ověření: node --check a izolované testy katalogu, nákupu, doručení a náhradního výstupu při obsazení. Zbývá vizuální průjezd ve 3D.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - babiččiny obchůzky

- Soubory: game.js, CHANGELOG.md. Dvakrát denně krátká návštěva u dveří dílny, jednou u Terezy na cvičišti. Nejvýše jedna místní poznámka během návštěvy, u Pavla má přednost připomínka k práci.
- Ověření: node --check game.js a izolovaná simulace tří obchůzek s limitem hlášek. Zbývá vizuální kontrola trasy na skutečném dvorku.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - opravy Babety, Lidl poštou a autobus do Hustopečí

- Soubory: game.js, CHANGELOG.md. Delší interval poruch, svíčka na silnici, karburátor před dílnou, demontáž a generálka motoru na ponku. Počítač v kanceláři přijímá objednávky, pošťák doručuje u zastávky. Pavel dostává každé dva herní dny 500 000 Kč.
- Viditelný autobus před domem ve 14 a 16 hodin. Půjčky aktualizují peněženku i zobrazení a ukládají se. Táta dává placené úkoly, osobní nabídky jsou filtrované podle zadavatele, máma má nové hlášky.
- Ověření: node --check game.js a izolovaný test půjčky a splacení v HUD, časů autobusu, objednávky, příchodu pošťáka, jednorázové výplaty a stavů motoru. Zbývá projít změny ve vykreslené hře.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - Babeta před dílnou

- Soubory: game.js, CHANGELOG.md. Parkování před vstupem, výběr místa podle kolizí, přední kolo směrem do dvora. Starší uložené pozice se jednorázově přesunou, stav motoru a paliva zůstane.
- Ověření: node --check game.js. Zbývá ručně projet dvůr v prohlížeči.

Podpis: ChatGPT

## 2026-11-27 - ChatGPT - Babetta 210, půjčky, zvon a Boban

- Změněné soubory: game.js, CHANGELOG.md.
- Modrá Pavlova Babetta u svářečky pod Bytem 2. Simon si ji smí půjčit každý třetí den. Po poruše lze sesednout a opravit ji. Pozice, stav a benzín se ukládají.
- Osobní půjčky a splácení mezi Pavlem, Simonem a Terezou. Polední zvon má dva údery. Boban častěji štěká a překáží, odkop má delší dosah.
- Ověření: node --check game.js, test převodů, limitu, splacení a oprávnění řidičů. Zbývá projet dvorek v prohlížeči a ověřit zvuk a animaci.

Podpis: ChatGPT

## 2026-11-27 — Claude (26) – Lidl v Hustopečích, mluvení s lidmi, velká mapa M, spaní, Milan do Benapolu

**Soubory:** game.js, index.html, CHANGELOG.md
**Změny:**
- Lidl přesunut do Hustopečí (zkušební mini-město mimo Klobouky: Lidl, 2 domy, silnice, cedule). Jezdí se autobusem (Klobouky – Boleradice – Hustopeče) ze zkušební zastávky před naším domem na Masarykově, jízdenka 25 Kč, zpět ze zastávky v Hustopečích.
- Svářečku Pavel už má (svařuje za Bytem 2) – je v základním vybavení, z Lidlu odstraněna; odměna mise 5 je teď úhlová bruska.
- Chodci: E = mluvit (hlášky, občas tip na zakázku), při rozhovoru se zastaví; před domem/plotem se otočí (neprochází zdmi). Domy se nestaví u křižovatek (auta je nezařezávají). Provoz brzdí před autobusem; u stojícího autobusu má nástup do autobusu přednost před auty.
- Oznámení z dvorku (kočky, babička, psi, Simon, Milan, zloděj na dvorku…) se nezobrazují, když je hráč daleko od domu (YARDCTX + farFromHome).
- Nabídky nářadí/obchodu: po zavření se myš správně zamkne zpět do hry (relock, smazání drag/kláves).
- M = velká mapa (už ne vypínání zvuku): klik = waypoint (modrý sloup + tečka a šipka v radaru), klik na waypoint = smazat; zakázky žlutě.
- Spaní: Pavel na matraci, Tereza v posteli v Bytě 1, Simon na gauči v hlavním domě – večer/noc = ráno dalšího dne, při dešti/mlze = prospíš déšť (+3 h, jasno). Energie na 100.
- Herní den (24 h) = 8 minut skutečného času, nezávisle na FPS (REALDT).
- Milan si jednou za den (10–17 h) dojde přes bránu do Benapolu a vrátí se (večerka s kinder vajíčky přijde později).
**Ověření:** node --check, render bez chyb, velká mapa, Milan vyráží.

Podpis: Claude

## 2026-11-27 — Claude (25) – elektrika hotová = byt svítí, další mise, Simon opravuje vraky

**Soubory:** game.js, CHANGELOG.md
**Změny:** Po opravě elektriky (ECO.elec) v Pavlově bytě svítí žárovka napořád, zmizí baterka, hláška „Proč nesvítí světlo“, tmavá hudba i text na matraci; táta už se neptá na elektriku. Příběh rozšířen o 6 misí (prodej auta Simonovi, oprava vraku, chycení zloděje, 3 další nářadí, všechny 3 stavby, výhra v šipkách) před finálními 20 000 Kč. Rozbité auto (vrak nebo poškození > 25 %) na dvorku: Simon k němu dojde a za ~12 s ho opraví; nebo E „Opravit auto sám“ (minihra) za Pavla/Simona.
**Ověření:** node --check, render bez chyb, Simon začne opravovat vrak.

Podpis: Claude

## 2026-11-27 — Claude (24) – pryč cizí kočky

**Soubory:** game.js, CHANGELOG.md
**Změny:** Odstraněny všechny náhodné kočky (5 ve městě + 2 na dvorku). Na dvorku zůstávají jen naše kočky (Nikíšek, Mája).
**Ověření:** node --check.

Podpis: Claude

## 2026-11-27 — Claude (23) – pekárna na Brněnské, cedule ulic + PŘEDÁVKA

**Soubory:** game.js, CHANGELOG.md
**Změny:** Pekařství Křížkovi přesunuto na Brněnskou (podle Milana). Cedule s názvy ulic: Masarykova, Jiráskova, Bratří Mrštíků, Příční, Brněnská, Krátká, náměstí Míru.
**Ověření:** node --check, render bez chyb.
**Zbývá pro ChatGPT:** Krumvíř/Borkovany (silnice + pár domů za hranicí TOWN), viditelné poškození aut (promáčkliny, rozbitá světla), hustší 3D tráva, dotykové ovládání pro město, hlasy moderátorů a hudba (ElevenLabs), pošta zevnitř, pohled z první osoby v dílně – zeptat se Milana. Milan hru od verze (16) ještě nehrál – nechat ho otestovat ovládání, kameru a grafiku (O = kvalita).

Podpis: Claude

## 2026-11-27 — Claude (22) – Tereza má vlastní úkoly, zvuky města

**Soubory:** game.js, CHANGELOG.md
**Změny:** Když hraješ za Terezu, K ukáže její denní úkoly: vyvenčit Ashley a Jackie (vodítko L, dojít na náměstí), nakoupit v COOPu, uklidit Byt 1 (u kuchyně, minihra drhnutí myší) – každý 250 Kč. Zvuky města přes WebAudio: šum provozu ve městě, ptáci přes den, silnější šum při dešti; uvnitř ticho.
**Ověření:** node --check, render bez chyb, okno Tereziných úkolů.

Podpis: Claude

## 2026-11-27 — Claude (21) – hlavní příběh, elektrika v bytě, minihry v dílně, oprava nářadí

**Soubory:** game.js, CHANGELOG.md
**Změny:**
- Hlavní příběh (STORY): 1) první zakázka, 2) první nářadí z Lidlu, 3) elektro z Benapolu (1 200 Kč) + oprava elektriky v Pavlově bytě u rozvodnice (minihra „drž linku“) → v bytě svítí, odměna multimetr, 4) stavba na dvorku, 5) 3 zakázky u pracovního stolu → svářečka, 6) našetřit 20 000 Kč. Aktuální mise v panelu „Dění na ulici“, ukládá se.
- Minihry: „tap“ (rytmus – šroubování), „hold“ (drž E/mezerník, ručička v pohyblivé zelené – svařování, elektrika), „stroke“ (tahy myší doleva-doprava – broušení).
- Dílna: Pracovní stůl – zakázky (svařování, šroubování, broušení, montáž) podle vlastněného nářadí; 12% šance, že se nářadí rozbije → oprava u stolu (150 Kč + minihra).
**Ověření:** node --check, render bez chyb, minihra hold reaguje na držení klávesy.
**Pro ChatGPT – kde co je v game.js:** ekonomika/obchody/zakázky/příběh = blok „EKONOMIKA, OBCHODY, ZAKÁZKY“ (hledej `const ECO=`), město = „KLOBOUKY U BRNA“ (`const SEG=`), provoz/policie = `const GN=` a `copsTickIn`, grafika/post-processing = `const GFX=` a `renderFrame`, interiéry = `RM`, `ENTRY`, `OUT`, `buildShops/buildPub/buildShed/buildCellar`, kamera = hledej `const FP=`.

Podpis: Claude

## 2026-11-27 — Claude (20) – psi na vodítku, Boban krade ve městě, zloděj ve městě

**Soubory:** game.js, CHANGELOG.md
**Změny:** Klávesa L: Pavel nebo Tereza vezme na vodítko až 2 psy, kteří jsou do 3 m (červené vodítko, psi jdou i do města, v 19 h se na dvorku pustí). Boban na vodítku ve městě občas vytrhne chodci mobil/rohlík/klobásu. Ve městě se občas objeví zloděj, okrade chodce a utíká – doběhni ho a E = 300 Kč odměna. Strom u výjezdu Masarykova × Krátká už nevzniká (stromy se vyhýbají domům).
**Ověření:** node --check, render bez chyb.

Podpis: Claude

## 2026-11-27 — Claude (19) – počasí, slepice a vejce, kočky na dvorku

**Soubory:** game.js, CHANGELOG.md
**Změny:** Počasí se střídá (jasno / zataženo / déšť s kapkami / mlha) po 2–6 herních hodinách, ztlumí slunce a zhustí mlhu; v panelu „Dění na ulici“. Kurník: 3 slepice chodí kolem, každé ráno 2–4 vejce, E = sebrat, v COOPu prodat (6 Kč/ks). Dvě kočky na dvorku přes den (8–19 h), dají se pohladit.
**Ověření:** node --check, reálný render s deštěm bez chyb, kurník postaven bez chyb.

Podpis: Claude

## 2026-11-27 — Claude (18) – hospoda, pošta, park, benzínka, barevné domy, ploty

**Soubory:** game.js, CHANGELOG.md
**Změny:** Hospoda U Zámku na náměstí (interiér z první osoby: výčep, pivo/utopenec/topinka, šipky o sázku 50 Kč přes minihru, štamgasti, hospodský). Pošta (budova). Park u zámku se stromy, cestou a lavičkami. Benzínka u Lidlu: auto má palivo (⛽ v HUD při jízdě), dochází, u stojanu zastav = natankuje (38 Kč/l). Domy ve městě barevnější, ploty s brankou podél chodníků, zaparkovaná auta u domů (Škoda/VW/Dacia, dají se ukrást).
**Ověření:** node --check, reálný render bez chyb (náměstí, ulice, hospoda zevnitř).
**Zbývá:** viz (17) – Krumvíř/Borkovany, Tereza se psy, Boban/zloděj ve městě, počasí, zvuky města, příběh, minihry v dílně, slepice, hustší tráva, strom u Krátké, dotykové ovládání, hlasy rádia.

Podpis: Claude

## 2026-11-27 — Claude (17) – kamera z první osoby, grafika podle Outpost Siege, policie, auta, obchody, ukládání

**Soubory:** game.js, characters.js, index.html, CHANGELOG.md

**Změny:**
- Uvnitř všech místností pohled z první osoby (oči postavy), stropy ve všech bytech, zrušen pohled shora i „uříznuté“ zdi. Opravena chyba, kdy se interiéry vykreslovaly i venku (zakomentovaný řádek).
- Grafika: PBR materiály (MeshStandardMaterial, lineární barvy), vlastní HDR post-processing (bloom, ACES, sRGB, vinětace) bez addonů r128; klávesa O = kvalita nízká/střední/vysoká (uloží se). Svítící lampy v noci, jasnější majáky. IBL přes PMREM vypnuté (v r128/SwiftShader černá scéna).
- Peníze, energie a hledanost má každá postava zvlášť.
- Policie: sirény jen do ~32 m, na dvorek nejede, na dvorku hvězdy hned zmizí. Městská hlídka jezdí i bez hvězd; rychlá jízda kolem ní = 1★. Zatčení → policejní stanice u náměstí; když nemáš na pokutu, zabaví nářadí.
- Auta: náraz odhodí druhé auto, poškodí obě, řidič vyskočí a utíká (opuštěné auto jde ukrást). Přesné kolize natočených domů (mřížka boxů v prostorové mřížce). Kamera v autě dál a výš.
- Golf stojí na dvorku místo červeného auta, Simon k němu chodí a odjíždí přes bránu.
- Byt 1: nápis DOMOV. Hlavní dům: máma vaří (dá jídlo), táta u TV (občas stovka).
- Červený domeček: dá se vlézt – tma, světlo jen z rozbitého okna, střepy, pavouci, pavučiny, schovaných 1 500 Kč pod prknem.
- Interiér Pekařství Křížkovi a Lidlu (PARKSIDE stojan, pokladny). Dílna začíná se 4 nástroji (kladivo, ruční pila, šroubovák, metr), ostatní se kupují v Lidlu a objeví se na stěně.
- Stavby z Benapolu: místo vybírá hráč (zelený/červený obrys před Pavlem, E).
- Simon kradené auto nejdřív prohlédne (minihra), cena podle výsledku. Autobusem 109 do Brna = konec dne. Shrnutí dne s penězi každé postavy. Ukládání: automaticky každý den + tlačítko v pauze, načtení při startu.
- Venku panel „Dění na ulici“, radar všude venku. Chodci mají kroky, lidé postávají na náměstí, trh se zeleninou. Kočky ve městě. Psi do města jen ten, za kterého hraješ.
- Stromy se vyhýbají domům, lampy pryč z křižovatek, kašna a stromy na náměstí mimo silnici.

**Ověření:** node --check; reálný WebGL render bez chyb (dvorek, náměstí, noc, Byt 1, hlavní dům, domeček, pekárna, Lidl); test pruhů provozu proti kolizím.

**Zbývá (z odpovědí):** hospoda U Zámku, pošta, park u zámku, benzínka u Lidlu + tankování, Krumvíř/Borkovany, barevnější domy s ploty, víc aut u domů (Škoda/VW/Dacia), viditelné poškození, Tereza – úkoly a venčení psů, Boban krade ve městě, zloděj ve městě, počasí, zvuky města, hlavní příběh, minihry v dílně (svařování/šroubování/broušení), oprava nářadí, hustší tráva, slepice a vejce, kočky na dvorku, dotykové ovládání, hlasy rádia, strom Masarykova×Krátká na trávník.

Podpis: Claude

## 2026-11-27 — Claude (16) – Milanovy odpovědi: dalších 50 otázek (karty)

dvorek otočený správně · pekárna Křížkovi je na Brněnské · Benapol u zámku OK · COOP na Jiráskově/Příční OK · Lidl + hřiště sedí · sklepy u Příční OK · přidat silnici a pár domů do Krumvíře/Borkovan · domy barevnější · u domů ploty a branky · vejít jen do pár domů (hospoda, pošta) · hospoda na náměstí (vymyslet jméno, např. U Zámku) s pivem, šipkami, štamgasty · park u zámku s lavičkami · zvony poledne + večer · policejní stanice – při zatčení tam odvezou · když nemáš na pokutu, zabaví nářadí · víc zaparkovaných aut u domů · auta Škoda/VW/Dacia · vidět poškození (promáčkliny, rozbitá světla) · benzínka u Lidlu, tankování · Simon přes den opravuje svůj Golf; na dvorku jsou 2 auta: modré (Simon ho opravuje) a černý Golf místo červeného auta z placu · tuning: Simon opravuje Golf, dá se s ním jezdit · Pavlova elektrika = úkol, Pavel ji dodělá · Pavel nemá auto (jen krade/půjčuje) · Tereza má úkoly (psi, nákupy, úklid) · psi ven jen na vodítku s Terezou/Pavlem · Boban ve městě krade lidem telefony z ruky, jídlo apod. · babička se jmenuje Babička, dává jídlo i peníze · sousedi z Bytu 2 můžou pomoct · zloděj krade i ve městě · ráno začíná rovnou na dvorku · bez víkendů · počasí střídat · zvuky města ano · rádio na dvorku jen když zapneš · peníze/energie větší · minimapu na dvorku nahradit radarem · úkoly dole nechat · hlavní příběh: Pavel dodělá dílnu a vydělá · odměny peníze i nářadí/auta · minihry v dílně: svařování (držet linku), šroubování (rytmus), broušení (tahy myší) · rozbité nářadí se opravuje · grafiku ještě neviděl · měkké stíny · hustší 3D tráva · FPS neví · priorita: ovládání a kamera

Podpis: Claude

## 2026-11-27 — Claude (15) – Milanovy odpovědi: 50 otázek (zadání)

1 ovládání jako GTA (W kam kouká kamera, myš točí) · 2 uvnitř domů pohled z první osoby · 3 kolečko zoom, Shift+kolečko nářadí · 4 Shift drží běh · 5 auto W/S A/D jako teď · 6 kamera v autě dál a výš · 7 převzít celý vzhled z Outpost Siege · 8 bez obrysů · 9 jemný bloom · 10 nastavení kvality nízká/střední/vysoká · 11 noc tmavá, svítí lampy a okna · 12 venku panel „Dění na ulici“ · 13 panel na dvorku nechat · 14 dvorek = klid: žádná policie, sirény, provoz · 15 dvorek úplně bezpečný, hvězdy zmizí hned · 16 sirény jen do ~30 m · 17 hvězda i za rychlou jízdu kolem policie · 18 energie zvlášť pro každou postavu · 19 do města můžou všichni včetně psů · 20 Tereza chodí s Ashley a Jackie na procházku · 21 Milan jak je · 22 v Bytě 1 nápis jen „DOMOV“ · 23 hlavní dům: problém je kamera · 24 v hlavním domě rodiče: máma vaří, táta u TV · 25 v červeném domečku schovaný poklad/peníze · 26 světlo jen z rozbitého okna · 27 chodců tak 20 · 28 na náměstí stánek/trh · 29 provoz jak je · 30 po nárazu řidič vystoupí a utíká/volá policii · 31 strom u Masarykova×Krátká posunout na trávník · 32 cedule se skutečnými názvy ulic · 33 interiér aspoň pekárny a Lidlu · 34 dílna začíná se 4 základními nástroji, další se kupují v Lidlu a objeví se v dílně · 35 odtahovka 1 500 Kč · 36 Simon kradené auto nejdřív prohlédne (minihra) · 37 zakázky na K · 39 místo stavby si vybírá hráč · 40 slepice snáší vejce na prodej · 41 kočky i na dvorku přes den · 42 autobusem do Brna = konec dne · 43 hlasy moderátorů česky · 44 hudbu vygenerovat · 45 den 8 min · 46 shrnutí dne s penězi a zakázkami · 47 ukládání automaticky každý den + tlačítko · 48 dotykové ovládání pro město · 49 priorita: grafika podle Outpost Siege · 50 nejhorší bug: Simon/Golf u garáže
(otázka 38 bez odpovědi)

Podpis: Claude

## 2026-11-27 — Claude (14) – celé Klobouky, provoz po silnicích, policie, peníze, obchody, zakázky

**Soubory:** game.js, index.html, CHANGELOG.md

**Změny:**
- Mapa: odstraněné vymyšlené ulice (Příční sever, Bří Mrštíků jih, řady domů a lamp u nich). Nová síť silnic podle satelitu (převod gx = −21,3 + (sy−440)·0,361 ; gz = 27,8 + (1225−sx)·0,361): Masarykova S/J, Jiráskova, Bří Mrštíků, Příční, obchvat (top), Brněnská, ke zámku, Wurmova, k Plotům, Bří…, k Pránu (pracovní názvy v ROUTES). Asfalt + chodníky + čáry + křižovatky instancovaně, zvednuté nad zem (bez z-fightingu). Hranice světa TOWN x −150..215, z −345..475, země 1600 m, mlha/kamera dál.
- ~390 domů podél silnic (InstancedMesh, natočené k silnici, kolize), lampy, 420 stromů jen mimo silnice/domy.
- Dominanty: náměstí Míru (dlažba, kašna se sloupem, lavičky, stromy), zámek + Městské muzeum (U), kostel u náměstí, evangelický kostel, PEKAŘSTVÍ KŘÍŽKOVI, BENAPOL, COOP JEDNOTA, LIDL (logo, parkoviště) u fotbalového hřiště (branky), vinné sklepy, ZŠ, odtahová služba. Za městem pole a vinohrady.
- Silniční graf GN/GA z tras (body uvnitř úseků se automaticky dělí na křižovatky; 42 uzlů, souvislý). 16 aut jezdí pravým pruhem, na křižovatkách náhodně odbočují, brzdí před hráčem/auty/chodci.
- Policie: městská (bílá, modrožlutý pruh, nápis MĚSTSKÁ POLICIE) 1–2 auta; od 3★ státní (POLICIE, modrá + reflexní žlutozelená); 5★ vrtulník s reflektorem. Cesta po grafu (Dijkstra), zaseknuté auto se přesune na nejbližší uzel.
- Zatčení: pokuta podle hvězd 1 000/3 000/6 000/12 000/20 000 Kč (max. co máš), vlastní auto (Golf/Simonovo/z placu) jde na odtahovku – výplata 1 500 Kč (E u odtahovky). Kradené auto policie zabaví.
- Peníze (start 5 000 Kč) a energie ⚡ v HUD, animace +/− Kč. Energie ubývá při práci; jídlo ji doplňuje, kafe/energy drink zrychlí minihru.
- Obchody (E u dveří): Pekařství Křížkovi (koláč, chleba se škvarky, kafe, buchty pro babičku), COOP (pivo, párky, energy drink, granule), LIDL PARKSIDE akční týden (každý den jiná akce −30 %, každé nářadí +10 % k výdělku), BENAPOL (materiál na plot, kurník, pergolu → Pavel staví na dvorku na kolících, místa se hledají automaticky na volném místě).
- Simonův tuning (E před garáží): lak, kola, spoiler, výfuk, motor (+30 % rychlost).
- Prodej kradeného auta Simonovi: přijeď před garáž, V – 3–8 tis. podle auta minus poškození.
- Zakázky (K): od babičky, sousedů z Bytu 2 a lidí z města – sekání, dřevo, plot, oprava auta (minihra se zelenou zónou, E/mezerník), stěhování autem (2 místa), venčení psa. Žlutý kruh se světelným sloupem.
- Babička: ráno zametá, v poledne nese jídlo (+50 ⚡ zdarma), v 18:20 volá psy (přiběhnou). Dá se u ní vzít zakázka.
- Sousedé z Bytu 2: v 6:25 odchází přes bránu na autobus, v 18:00 se vrací.
- Autobus 109 (Brno – Klobouky – Čejč): jezdí tam a zpět, zastávky Klobouky u Brna škola / nám. / samoobsluha (označníky + přístřešky).
- Traktor John Deere jezdí po polích (dá se ukrást, pomalý). 18 chodců na chodnících (srážka = 1★). Míč na hřišti se dá kopnout i autem, góly.
- Zvony v poledne a v 18:00 (WebAudio). Rádio: hlášky moderátorů jako titulky. Buňky B1–B4 jdou otevřít (spící zloděj / drobné peníze).

**Ověření:** node --check; reálný WebGL render (Chrome + SwiftShader, three r128): bez chyb v konzoli; graf souvislý 42/42; auta i autobus jezdí; zakázka → minihra → výplata (5 000 → 5 520 Kč); 5★ → 2 městská + 3 státní auta + vrtulník; zatčení strhne pokutu; screenshoty náměstí, ulic, policie, autobusu, okna zakázek.

**Doplněno v tomtéž kole:**
- Vinný sklep „U Škvoreňáků“ (prostřední dveře u sklepů, pohled shora): sudy, stůl s lahvemi, mřížka s víny; ochutnávka (+10 ⚡ 1× denně), láhev 180 Kč = zakázka navíc od babičky.
- 5 koček ve městě (náměstí, zámek, Benapol, pekárna, u domu) – E = pohladit.
- Buňky B1–B4: přední strana je u zdi (nedosažitelná), dveře/místa přesunuta na zadní/boční stranu (ověřeno blocked()).
- Stavby z Benapolu se hledají jen na trávníku k babičce (ne na chodníku), ověřeno screenshotem.

**Zbývá:** hlasy moderátorů (ElevenLabs), přesná jména ulic z Street View, policejní auta se občas překrývají, grafika (bloom/efekty).

Podpis: Claude

## 2026-11-27 — Claude (13) – Milanovy odpovědi na 30 otázek (zadání pro další práci)

1 start 5 000 Kč · 2 výkup kradeného auta u Simona 3–8 tis. podle auta · 3 pokuta podle hvězd (1★ 1 000 … 5★ 20 000 Kč) + zabavení auta · 4 Lidl u fotbalového hřiště · 5 Lidl = PARKSIDE akční týden (každý den jiná akce) · 6 Benapol: Pavel staví další věci na dvorku (plot, kurník, pergola…) · 7 pekárna Křížkovi: jídlo dodá energii · 8 energie lehce (jídlo zrychlí práci)
9 práce zadávají babička, Ukrajinci, lidi ve městě · 10 práce: plot/sekání/dřevo, opravy aut sousedům, odvoz a stěhování autem, venčení psů · 11 babička vychází ven, vaří a volá na psy · 12 Ukrajinci chodí chodbou u skladu (Byt 2): ráno odcházejí do práce, večer zpět do bytu · 13 buňky B1–B4 se dají otevřít, uvnitř zloděj
14 Pavel nemá auto · 15 městská policie: Škoda Octavia bílá, modrožluté pruhy, MĚSTSKÁ POLICIE · 16 státní od 3★ Octavia, od 5★ vrtulník · 17 zabavené auto: odtahovka, jde vyplatit a vyzvednout · 18 tuning u Simona: barvy, kola, spoiler, výfuk + motor (rychlost) · 19 autobus: nastudovat linku 109 (zastávky Klobouky u Brna) · 20 traktor John Deere
21 rádio se stanicemi a moderátory (vygenerovat hlasy/jingly) · 22 za městem pole a vinohrady · 23 vinné sklepy se dá vejít · 24 zámek a muzeum jen budovy · 25 hřiště: dá se kopat do míče · 26 kostely zvoní v poledne a večer · 27 grafity jen obecné sprosté · 28 minihry v dílně ano (řezání, vrtání na čas) · 29 kočky se dají hladit · 30 v hlavním domě bydlí Pavlovi rodiče (jména zatím neznámá)

Podpis: Claude

## 2026-11-27 — Claude (12)

- Golf stojí před garáží (příjezd), v garáži je jen haraburdí (pneumatiky, regál s kanystry, krabice, sekačka, kolo). Simon odjíždí/přijíždí bez garáže.
- Dílna: bílé zdi, černé sprejové grafity se sprostým humorem a blbou gramatikou (WC SMRDÍ ↓, ← JEPIÁK u reprobedny, SERU NA TO, NESAHEJ MI NA VRTAČKU KOKOTE, KDIŽ TO NEJDE KLADIVEM VEM VĚTŠÍ KLADIVO, ZAVÍREJ DVEŘE TY VOLE, BOBAN JE ZLODĚJ, PIVO = PALIVO, DO PRDELE S TÍM, KDO SEBRAL BITY?!, ELEKTRIKA V PROCESU OD 2019, PARKSIDE > MAKITA, 40), zelené a černé zásobníky nad sedačkami (podle fotky).
- Ověřeno skutečným renderem (headless Chrome + WebGL): dílna, interiéry, bez chyb.
- Milanovy odpovědi (09:45): peníze ano (úkoly, prodej kradených aut, práce pro sousedy; utrácet za pokuty a zabavení auta, nářadí v Lidlu, opravy a tuning aut, jídlo v pekárně Křížkovi), obchody Lidl, Benapol, Pekárna Křížkovi, COOP Jednota, chodci, autobus, traktory a dodávky, policie městská (1–2 ★) i státní (3+ ★), celé Klobouky s detailem u nás (náměstí, zámek, pekárna, Benapol, hřiště, sklepy). Rozpracováno, poslán seznam 30 doplňujících otázek.
- Soubory: game.js, CHANGELOG.md.

Podpis: Claude

## 2026-11-27 — Claude (11)

- Testování se skutečnou 3D grafikou: three.min.js (r128) stažený do `downloaded/`, headless Chrome se SwiftShader WebGL – screenshoty dvorku, interiérů a jízdy, bez chyb v konzoli.
- Interiéry Bytu 1, Bytu 2, hlavního domu a skladu dílů: pohled shora (jako Sims) – bez stropu, zdi snížené na 1,15 m (řez), kamera přes zdi nekoliduje (`RM[r].top`). Dřív kamera v hlavním domě lezla postavě do hlavy.
- Byt 1 (Tereza a Milan) nově: koupelna se sprchou, ložnice s manželskou postelí a skříní, kuchyň se stolem, obývák s gaučem a TV, psí kout (2 pelíšky, misky, vodítka, poháry z agility), Milanův koš na dřevo a holínky, cedule TEREZA & MILAN.
- Auta z našeho placu (vrakoviště) jsou naše – bez krádeže a hvězd. Pavel může Simonovi ukrást Golf; když Simonovi rozseká auto (Golf nebo pracovní), Simon zavolá policii (+2 ★).
- Poškození aut: kouř od 50 %, při 100 % vrak (tmavý, hoří, nedá se řídit). Golf se ráno opraví; když je rozbitý, jde Simon domů pěšky.
- Simon může řídit své pracovní auto vždy a svůj Golf; Golf parkuje v žluté garáži (bezpečnostní kamera s blikající LED nad vraty), SIM skript otevírá/zavírá garáž.
- Sloup lampy u výjezdu z příjezdu odstraněn. Hvězdy hledanosti velké vpravo nahoře; radar jako v GTA vlevo dole (při jízdě a při hledanosti, otáčí se podle směru).
- U vstupu do Pavlova bytu delší text, proč nesvítí světlo (elektrika v procesu).
- Rozpracováno (nedokončeno, čeká na Milanovy odpovědi): mapa celých Klobouk podle satelitu (transformace sat → hra: gx = −21,3 + (sy−440)·0,361, gz = 27,8 + (1225−sx)·0,361).
- Soubory: game.js, index.html, CHANGELOG.md.

Podpis: Claude

## 2026-11-27 — Claude (10)

- Nové zvuky z ElevenLabs (vygenerované v Milanově účtu, uložené v `sfx/`): engine_idle (smyčka), engine_rev, car_door, horn, tires, crash, car_alarm, glass_break, siren (smyčka), welding, spray, gate, garage, radio. Hlas policie z megafonu se nestáhl.
- Zvuky zapojené: brána/garáž, svařování Pavla, nastupování, motor v autě (výška podle rychlosti), náraz.
- Auta jako v GTA (`VEH` = registr všech aut):
  - E u libovolného auta: zaparkované = rozbít okýnko + alarm (+1 ★), z provozu = vyhodit řidiče (utíká pryč, +2 ★), policejní (+2 ★). Simonův Golf ukrást nejde (SIM skript s ním jezdí). Simonovo auto jako dřív (po tuningu).
  - Řízení (`driveTick`): rychlejší (max ~68 km/h), mezerník = ruční brzda se smykem a pískáním pneumatik, H = troubení, Y = rádio (stanice Rádio Kotel / Rock Dílna FM / Dvorek FM / Haf Haf Rádio / Noční jízda = nálady hudby).
  - Provoz: 9 aut jezdí po dvou okruzích (pravostranně: Masarykova–Příční–Jiráskova–Krátká a Masarykova–Bří Mrštíků–Jiráskova–Krátká), zastaví před hráčem i jinými auty a troubí (`LOOPS`, `TRAF`, `trafficTick`).
  - Policie: hledanost 0–5 ★ (HUD `#wanted`), až 3 policejní auta s majákem a sirénou, jezdí po grafu křižovatek (`RN`, `RE`, `roadPath`) a zblízka přímo na hráče. Když u tebe 2,5 s stojí, jsi ZATČEN (návrat domů, hledanost 0). Když 18 s žádná hlídka do 45 m, hledanost klesá.
- Zaparkovaná auta z jízdních pruhů přesunuta na parkovací záliv západně od Masarykovy (8 míst).
- Soubory: game.js, index.html, sfx/*.mp3 (14 nových), CHANGELOG.md.
- Ověření: `node --check`; headless: 22 aut v registru, provoz jede, krádež → ★ + policie se objeví, rádio, regresní testy bez chyb. Jízdní vlastnosti a vzhled neověřeny ve skutečném prohlížeči.
- Zbývá: grafity v dílně (čeká na seznam), bloom/grafika, Street View detaily ulic.

Podpis: Claude

## 2026-11-27 — Claude (9)

- Větší mapa (okolní bloky, ~175 × 300 m): Masarykova prodloužená, nová Jiráskova (východ, px x 2600–2790), Příční (sever, py −3000…−2810), Bří Mrštíků (jih, py 5200–5390), Krátká až k Jiráskově; chodníky, středové čáry.
- Zástavba: řady domů podél všech ulic generované funkcí `row()` – domy, střechy a okna jsou instancované (pár draw callů), domy mají kolizi; pouliční lampy, 220 stromů mimo ulice a domy (`BG` = seznam obsazených obdélníků).
- Hranice světa venku: x −118…57, z −148…148 m (interiéry zůstávají na x ≥ 66). Kamera far 600, mlha 90–320, obloha r 450, tráva 640 × 640.
- Interiéry jsou ve skupině `interiorG`, viditelné jen uvnitř (jinak by z Jiráskovy byly vidět v dálce).
- Rozhodnutí Milana (09:10): grafika = kreslený styl + efekty (nebe, bloom, lepší stíny/materiály, inspirace Outpost Siege), mapa = okolní bloky, auta = krádež libovolného auta, provoz, policie s hledaností, lepší řízení; pošle Street View, seznam grafitů do dílny (fotka dílny: bílé zdi, černé sprejové nápisy, zelené/černé zásobníky na stěně).
- Soubory: game.js, CHANGELOG.md.
- Ověření: `node --check`; headless regresní testy + BFS interiérů OK. Vzhled okolí neověřen.
- Zbývá: provoz, krádeže, policie, řízení (ruční brzda, drift, rádio), bloom, grafity v dílně, Street View detaily.

Podpis: Claude

## 2026-11-27 — Claude (8)

- Hlavní dům přestavěný bez zasekávání: obvodové zdi plné (dveře ven jsou kulisa, ven se jde přes E), průchody mezi místnostmi 1 m, pevný je jen nábytek u zdí, stoly/židle a postele ve vstupní části bez kolize. Dřív šlo dveřmi z dvorku projít do prázdna mimo dům a půlka místností byla nedostupná.
- Ověřeno automaticky: mřížkové prohledání (BFS, poloměr postavy 0,3 m) ze všech vstupů – všechny místnosti a všechny body pro E jsou dosažitelné v hlavním domě, Bytě 1, Bytě 2, skladu dílů, dílně i Pavlově bytě. Opraveno: Byt 1 (TV stála u vstupu, postel zakrývala bod), Pavlův pokoj (postel u dveří).
- Psi nesmí na ulici: drží se v areálu (px 64–1252 × 62–1420), i když je otevřená brána.
- Postavy, které zůstanou venku (ulice, příjezd), se samy vrátí: cesta po ulici k bráně, brána se jim otevře a zase zavře (`outsideYard`, `homePath`, `goHome`). Platí pro Pavla, Terezu i Simona.
- Soubory: game.js, CHANGELOG.md.
- Ověření: `node --check`; BFS všech interiérů OK; Pavel z Krátké a Simon z Masarykovy došli bránou zpět (brána se zavřela); psi zůstali v areálu; regresní testy bez chyb.
- Čeká na Milana: nápisy/grafity v dílně (pošle seznam), grafika podle přiloženého Outpost Siege (index.html, three r160 + PBR + bloom), větší mapa (Klobouky u Brna, Google Maps), auta jako v GTA.

Podpis: Claude

## 2026-11-27 — Claude (7)

- Hlavní dům podle Milanova nákresu (`hlavni-dum-nakres.png` vyplněný): Pavlův pokoj, kancelář, vstup z ulice (jih, dveře na Krátkou), kuchyň (linka, sporák, dřez, lednice, stůl), obývák (TV, gauč, kulatý stůl se 2 židlemi u okna), WC s vanou, prádelna, ložnice; vstupní část pod pergolou (byt / byt / ložnice). Východ od x 8,9 m zatím prázdný.
- Vstupy přes tabulku `ENTRY` (`enterRoom(klíč)`): hdum (z dvorku), hdumPerg (pod pergolou), hdumStreet (z Krátké). Východy `OUT.pergola`, `OUT.kratka`. `RM.hdum` teď pokrývá i vstupní část (cz −3,65, d 12,7).
- Fotka zaměstnance měsíce je ve hře: `simon-foto.js` (JPEG 300×400 jako data URI).
- Byt 1 = Tereza a Milan (texty). Ashley i Jackie zalézají do Bytu 1 (už bylo).
- Soubory: game.js, simon-foto.js, CHANGELOG.md.
- Ověření: `node --check`; headless: všechny 3 vstupy a východy hlavního domu, pohyb uvnitř, fotka načtená, regresní testy bez chyb. 3D vzhled neověřen.
- Zbývá: co bude ve východní části (8,9–18 m) / hranice s babičkou, odpovědi na otázky z minula.

Podpis: Claude

## 2026-11-27 — Claude (6)

Velká várka podle Milanova nákresu a zpráv 08:33–08:50.

**Interiéry (nový obecný systém místností)**
- `RM` = tabulka místností {cx,cz,w,d,h,f(okolní světlo),L(stropní světlo)}: shop, flat, byt2, byt1, hdum, sklad. Interiéry stojí daleko od dvorku (x 70–220). Kamera se ořezává podle `RM[room]`, jedno sdílené světlo `roomL`.
- `OUT` = kam se vyjde ven z místnosti [x,z,směr]; `exitRoom(to)` bere volitelný cíl (např. `'street'`). `enterRoom(r,msg)` = vstup.
- Spoty uvnitř mají `in:'byt2'` atd. (shop a flat dál 1 a 2).
- Byt 2: prádelna (pračky, sušák, koš) → sklady (regály s krabicemi) → zadní dveře na Masarykovu (venku průchod v živém plotu u Z(620)). Dveře k Ukrajincům jsou zamčené.
- Byt 1 (Terezin): koupelna, kuchyně, pokoj s postelí, TV a PC.
- Hlavní dům: prázdná místnost 18 × 5,4 m (čeká na Milanův nákres, podklad `hlavni-dum-nakres.png`). Vstup z dvorku i zpod pergoly.
- Sklad dílů nad zdí: po žebříku nahoru, 12 regálů (volant, sedačka, nárazník, čelní sklo, zrcátko, světlomet, kolo, dveře, výfuk, autobaterie, autorádio, kapota). E = vzít/vrátit, díl se nese v rukou (`carry`, `takePart`, `dropCarry`), B = položit, u auta E = položit k autu.

**Auta a vrata**
- Brána v severní zdi je otvíratelná (E z obou stran; `GATE`, `toggleGate`, solid se přidává/odebírá).
- Modrý dům otočený: garáž na západním konci s otvíratelnými vraty (`window.__GAR`, `toggleGarage`), dřevěná pergola s balkonem na východ k bazénu.
- Simonovo auto je skupina `carG`; po dokončení tuningu se dá řídit (E u auta, W/S, A/D, E vystoupit; `DRV`, `enterCar`, `exitCar`, `driveTick`). Úkoly a obchůzka Simona jsou relativní k autu přes `ca(dx,dz)`.
- Parkoviště na vrakovišti: 3 další auta (`mkCar`, `carBox`). Černý Golf před garáží (`golf`): Simon s ním ve 21:00 odjíždí (projde bránou, ta se sama otevře a zavře) a v 7:00 přijíždí (`SIM`, `simonTick`).
- Hranice světa: postavy i auto se drží v x −38…40, z −34…44.

**Postavy**
- Jackie (i Ashley) večer zalézají do Bytu 1, Boban do hlavního domu a přes den se tam občas jde schovat (mód `hide`). Mája chodí od babičky / k babičce. Tereza spí v Bytě 1 (beze změny).
- Pavel, když za něj nehraješ (8–21 h), svařuje stůl za Bytem 2 u zdi (svářečka, jiskry, modré světlo; `pavelIdle`, `weldFx`). Každá postava si po přepnutí hledí svého.
- Nářadí si z dílny může vzít i Simon (`holder`, `canTool`); B = odhodit nářadí na zem, E = zvednout (`onGround`, `dropHeld`, `pickGround`). Myš se po výběru nářadí znovu zamkne (dřív bylo nutné kliknout znovu).
- Boban s ukradeným nářadím: nářadí je v tlamě větší a vidět, bublina „MÁ TVOJE NÁŘADÍ!“.

**Dílna**
- Nové modely nářadí (aku vrtačky s motorem, převodovkou, spojkou, sklíčidlem, gumovou rukojetí a baterií; pily, bruska, kladivo s kladivem a drápem, hoblík, svěrka, metr, vodováha, pistole na lepidlo, multimetr, páječka, klíč).
- Na OSB deskách jsou namalované obrysy přesně podle tvaru nářadí (místo tmavých obdélníků), jemnější OSB textura.
- Cedule ELEKTRO → JISTIČE. Text v liště podle postavy (ne vždy „Pavel“).

**Svět**
- Kolem dílny žádný trávník – hlína (textura) v oblasti px 622–1255 × 58–558.
- Dlažba končí na px 900, dál trávník k babičce a velký strom, jehož koruna roste k sousedům.
- Větší texty: oznámení (toast) 22 px tučně, lišta úkolu 22 px, panel „Dění na dvorku“ 19 px, nápověda E 20 px.
- `simon-foto.js`: místo pro fotku zaměstnance měsíce přímo ve hře (`window.SIMON_PHOTO` = data URI). Fotku zatím nemám – potřeba dodat soubor.

- Soubory: game.js, index.html, simon-foto.js (nový), hlavni-dum-nakres.png (nový), CHANGELOG.md, README.md.
- Ověření: `node --check`; headless Chrome s náhradou Three.js: vstup/výstup do všech místností včetně ulice, sklad dílů (vzít, položit B), odhození nářadí Pavlem i Simonem, jízda autem (couvnutí o 2 m, vystoupení), odjezd a příjezd Simona Golfem přes bránu, Pavel jde svařovat, psi domů, regresní testy (start, úkoly, trénink, zloděj) – bez chyb. Skutečný 3D vzhled a ovládání auta v prohlížeči neověřeny.
- Zbývá: vybavení hlavního domu podle nákresu, fotka Simona do simon-foto.js, aktualizovat mapa-2d.png, doladit řízení podle zkušenosti.

Podpis: Claude

## 2026-11-27 — Claude (5)

- Podle nákresu a fotek: severní hranice je zeď s posuvnou bránou (příjezd aut), za ní kulisa – modrý patrový dům s dřevěnou pergolou a balkonem, garáž, příjezd, bazén se žlutými zdmi (delfíni, sluníčko), jehličnany, obytné buňky B1–B4 (kontejnery).
- Západ vrakoviště: sklad náhradních dílů ve zdi (výklenky s volanty a koly), bez schodů – žebřík + interakce.
- Vrakoviště přeskládané: regál s V8 svisle, nárazníky vlevo dole, 2 stohy dveří, skla vlevo, Simonovo auto posunuté k bráně (Simonovy úkoly jdou s ním).
- Zloděj z buněk (bez etnického zobrazení): jednou za herní den (9–21 h) přeleze u brány a jde do dílny, na vrakoviště nebo k autu; E ho vyžene, Boban ho vyštěká; když uteče, započítá se do statistik konce dne. Červená tečka na minimapě.
- Okolí: Masarykova (západ) a Krátká (jih) s chodníky, křižovatka s přechodem, uliční cedule, 17 domů kolem, zaparkovaná auta, pouliční lampy. Jižní křídlo východ = vstup k babičce (cedule + interakce).
- Soubory: game.js, CHANGELOG.md.
- Ověření: `node --check`; headless (zloděj: příchod, krádež, vyhnání, odchod; start, úkoly) bez chyb; půdorys okolí zkontrolován vykreslením shora. 3D vzhled neověřen.
- Zbývá: interiér hlavního domu / bytů podle nákresu (čeká na odpověď), aktualizace 2D mapy.

Podpis: Claude

## 2026-11-27 — Claude (4)

- Grafika dvorku: tráva s texturou (stébla a skvrny), ~1800 trsů trávy a kytičky na travnatých plochách (mimo cesty, budovy a cvičiště), lístky na živém plotu, 70 stromů za plotem pro hloubku, 9 mraků, které pomalu plují (uvnitř se skryjí), střechy s taškami.
- Stíny jdou za hráčem – ostré na celé mapě, ne jen uprostřed.
- Přidána 2D mapa `mapa-2d.png` / `mapa-2d.jpg` (generovaná ze souřadnic hry) pro dokreslení úprav.
- Soubory: game.js, mapa-2d.png, mapa-2d.jpg, CHANGELOG.md.
- Ověření: `node --check`; headless testy (start, úkoly, trénink, byt) bez chyb. Skutečný 3D vzhled a výkon neověřen – bez přístupu k Three.js v testu.
- Zbývá: podle screenshotu doladit hustotu trávy/stromů, případně výkon.

Podpis: Claude

## 2026-11-27 — Claude (3)

- Úvodní obrazovka: místo vodorovného posuvníku levý panel (na mobilu spodní) – menší černý nápis THE PARKSIDE, mřížka 3×3 postav, popis a tlačítko Hrát. 3D postava je posunutá vpravo (na mobilu nahoru), panel ji nepřekrývá.
- Vypnut ACES tone mapping – barvy byly vybledlé. Obloha a slunce zůstávají.
- Tereza má vlastní trénink (10 kroků): sedni, lehni, přivolání, zůstaň; pak skoková laťka, slalom a kladina pro Ashley i Jackie (překážky zpřístupní Pavlova stavba). Pes předvede cvik (skok přes laťku, kličkování mezi tyčemi, chůze po kladině). Když Tereza odejde, trénink se přeruší.
- Pavlův byt: kromě baterky utržené světlo na drátu, které nepravidelně bliká (s cvaknutím).
- Soubory: game.js, index.html, CHANGELOG.md.
- Ověření: `node --check`; headless Chrome (náhrada Three.js): rozložení startu 1280×800 i 390×844, Terezin trénink 1–5 včetně výšky skoku Ashley (~0,83 m), vstup do bytu, bez chyb. Vzhled 3D ve skutečném prohlížeči neověřen.
- Zbývá: vzhled Milana, další obsah Pavlova bytu.

Podpis: Claude

## 2026-11-27 — Claude (2)

- Oprava: po vstání ze sedačky šlo zůstat zaseknutý v kolizi sedačky. Nově `standUp()` + `unstuck()` posadí postavu před sedačku; vstává se pohybem, Shiftem i E. R uvnitř místnosti vyprostí postavu.
- Úvodní obrazovka přes celou obrazovku: 3D náhled na pozadí, velký gradientní nápis THE PARKSIDE, karty postav a panel s popisem dole, vinětace, rychlejší render náhledu.
- Úkoly (nezávislé na jiných postavách): Pavel vyrábí překážky pro psy – dřevo → ponk ve venkovní dílně (pila / vrtačka / šroubovák / hoblík) → stavba na cvičišti: skoková laťka, slalomové tyče, kladina (12 kroků, vyžaduje správné nářadí v ruce). Simon má po tuningu dalších 8 kroků (kola, nárazník ze stohu, olej, leštění, start). E na místě, průběh v % v liště úkolu.
- Venkovní dílna je přístupná: koza s prknem odsunutá ke kraji a bez kolize, ponk slouží jako pracoviště.
- Grafika: obloha jako shader (přechod obloha/horizont, slunce s kotoučem a září, západ slunce, noc), barva slunečního světla podle denní doby, ACES tone mapping.
- Dílna: nářadí na dvou OSB deskách, úhledně na háčcích s namalovaným obrysem; méně nepořádku na zemi; detailnější nářadí (sklíčidlo s čelistmi, gumový úchop, žebrování baterie, spona, zuby pil, hlava kladiva).
- Soubory: game.js, index.html, CHANGELOG.md.
- Ověření: `node --check`; headless Chrome s náhradou Three.js – úvodní obrazovka, úkol Pavla (dřevo, kontrola nářadí, řezání), vstání ze sedačky a chůze, bez chyb. 3D vzhled (obloha, tone mapping, OSB) ve skutečném prohlížeči neověřen.
- Zbývá: případně doladit expozici tone mappingu podle vzhledu, trénink psů na postavených překážkách.

Podpis: Claude

## 2026-11-27 — Claude

- Úvodní obrazovka je výběr postavy: velký nápis THE PARKSIDE, pod ním „Vyber postavu“, 3D řada všech postav (Pavel, Simon, Tereza, Ashley, Jackie, Boban, Milan, Nikísek, Mája) s popisem, co dělají. Začíná se Pavlem; Simon a Tereza se odemknou, až Pavel v dílně poprvé použije nářadí (G / klik). Odemčení se pamatuje v prohlížeči (localStorage `parksideUnlocked`).
- Přepínání Q v pořadí Pavel → Simon → Tereza. Za Terezu klávesa X (nebo tlačítko X) přepne na Ashley, další X na Nikíska, pokud je do 10 m, jinak zpět na Terezu. Zvířata mají vlastní akci na E (Ashley žere věci ze země / štěká, Nikísek mňouká a dá Bobanovi packou). Večer se ovládání zvířat samo vrátí Tereze.
- Dole je pořád vidět lišta s úkolem; každá postava i zvíře má jiný úkol.
- Dílna podle screenshotu: jmenovka „Simon Konečný“, české SPZ ve sloupci pod rámečkem, 5 amerických SPZ na stěně nad stolem 2, rozvaděč s jističi a trubkami pod cedulí ELEKTRO, nábytek pod nářadím (skříňka s dvířky a šuplíková komoda).
- Soubory: game.js, index.html, README.md, CHANGELOG.md.
- Ověření: `node --check`, headless Chrome s náhradou Three.js (výběr postavy, zámek Q, odemčení, pořadí Q, X na Ashley a zpět, akce E) bez chyb. Vzhled 3D ve skutečném prohlížeči neověřen.
- Zbývá: minihry v dílně, překážky pro cvičiště, podoba Milana.

Podpis: Claude

## 2026-11-27 — ChatGPT

Podle nákresu jsem v game.js přesunul dveře Pavlova bytu z pozice 500 na místo okna v pozici 380. Původní vstup je prázdná stěna. Stejnou souřadnici používá vstup, návrat ven, světlo, Boban i Pavlova cesta domů. Ověřeny odkazy a syntaxe.

Podpis: ChatGPT

## 2026-11-27 — ChatGPT

V game.js jsem posunul auto z mapové pozice (450, 590) na (450, 390) na plac s náhradními díly. Z polohy auta se počítá také Simonův start, obchůzka a místo interakce u kapoty. Ověřena syntaxe a odstup trasy od domu, auta a stojanů s díly výpočtem v souřadnicích mapy.

Podpis: ChatGPT

## 2026-11-27 — ChatGPT

Pauzu lze zapnout kliknutím v HUD a klávesou Esc přepínat oběma směry. Oba zamčené byty mají společný plný kolizní blok a uzavřenou pultovou střechu. Původní druhá polovina budovy byla omylem součástí komentáře. Změny v game.js a index.html. Kontrola syntaxe a kolizí v obou polovinách; vzhled nebyl ověřen ve hře.

Podpis: ChatGPT

## 2026-11-27 — ChatGPT

V index.html jsem opravil čitelnost pauzy. Text úkolu má tmavou barvu na krémovém podkladu a tlačítko Pokračovat má vlastní kontrastní barvy. Kontrast obou kombinací ověřen výpočtem.

Podpis: ChatGPT

## 2026-11-27 — ChatGPT

- Obnoven název The Parkside v HUD, menu, titulku, přehledu postav a README. Esc jednosměrně zapíná pauzu, zastaví i zvukové efekty. Pokračovat znovu vyžádá ovládání myší.
- Simon střídá práci u kapoty s obchůzkou kolem auta a má na minimapě jmenovku.
- Maya vybírá průběžně bezpečné přímé trasy podle kolizí, dostane pozici hned při zobrazení a pronásledující kocour běží za ní.
- Upraveny game.js, index.html, postavy.html, README.md a tento changelog. Kontrola syntaxe přes Node; obraz a interakce v prohlížeči dosud neověřeny.

Podpis: ChatGPT


## 2026-11-27 — ChatGPT

- Nový název v menu, HUD, titulku stránky a dokumentaci. Název pracovní složky na A: zůstává stejný. Jméno mechanika je Simon.
- V characters.js a game.js přibyl hratelný mechanik s tmavou pletí a pracovními montérkami, auto s otevřenou kapotou na vrakovišti a čtyřkroková zakázka přes E. Simon jako NPC pracuje u motoru. Hráč může práci převzít, vyndat a namontovat motor a dokončit tuning.
- Q, Tab i dotykové tlačítko cyklují dostupné postavy. Přepnutí je zamčené v interiérech i během přechodu dveřmi. Upraveny minimapa, inicializace hráče a noční rutina pro tři postavy.
- Tereza se přes den při ovládání jiné postavy pohybuje na cvičišti a Ashley ji při hře obíhá. Při ovládání Terezy se vrátí původní vedení psů.
- Esc pozastaví simulaci, čas, plánované přechody scén a hudbu. Pauza ukazuje úkol podle postavy a stavu auta. Panel vpravo zobrazuje činnosti lidí a zvířat.
- V dílně se při vstupu přepne hudební režim a venkovní zvukové smyčky ztichnou. Reproduktory jsem posunul výš, na SPZ přidal vtipné texty a osadil rámeček s popiskem „Zaměstnanec měsíce“ a jmenovkou Simon.
- Skutečná fotka: dříve dodaný soubor image(20261127-061922).png, identifikátor libfile_a6f503ed9d4c8191b220ea9c18a5271d. Přenos originálu do projektu selhal při DNS. Rámeček načítá downloaded/simon.png; případně lze přímo u rámečku stisknout E a zvolit skutečnou fotografii. Výběr se ukládá v prohlížeči.
- Soubory: game.js, characters.js, index.html, postavy.html, README.md, CHANGELOG.md, AGENTS.md, CLAUDE.md.
- Ověření: syntaktická kontrola obou JavaScriptů pomocí Node. Samostatný test logiky ověřil cyklus postav, zákaz přepnutí uvnitř, čtyři fáze opravy a pauzu. Zbývá doplnit originál fotky do projektu a ověřit obraz, poslech, průchod dveřmi a celé hraní v prohlížeči.

Podpis: ChatGPT

## 2026-11-27 — ChatGPT — první kontrola a předání

- V A:/parkside game jsem prošel hlavní soubory a ověřil, že index.html načítá místní characters.js a game.js.
- V game.js jsem dohledal vstup a odchod z dílny, volbu hudby shop/hifi, čtyři rohové reproduktory, seznam SPZ a jmenovku zaměstnance. Šlo o kontrolu existujícího kódu. Poslech a vzhled scény tehdy nebyly ověřeny.
- Založil jsem CHANGELOG.md, AGENTS.md a CLAUDE.md. Zaznamenal jsem otevřené úkoly pro hudbu, mechanika u autodílů, fotografii v rámečku, vtipné SPZ a viditelnost reproduktorů.

Podpis: ChatGPT

