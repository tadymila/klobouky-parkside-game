# The Parkside

3D sandboxová hra v prohlížeči (Three.js r128) zasazená na dvorek a do Klobouk u Brna a okolí. Hráč přepíná postavy i zvířata, plní zakázky a příběh, opravuje auta a nářadí, nakupuje a řeší každodenní život i hledanost u policie.

## Co je ve hře
* **Postavy a zvířata:** Hratelní jsou Pavel, Simon, Tereza a přes Terezu také psi Ashley a Jackie nebo kocour Nikísek. Na dvorku a ve městě se pohybují i další postavy a zvířata včetně Bobana, Máji, Milana, babičky, rodičů, sousedů či chodců.
* **Dvorek a dílna:** Výběr postav, dílna se základním i dokupovaným nářadím (včetně variant FESTA a PERFORMANCE), pracovní stůl s minihrami (svařování, šroubování, broušení), opravy nářadí, stavby na dvorku, sklad dílů, červený domeček a živý přenos kamer v televizi hlavního domu.
* **Interiéry:** Pohled z první osoby uvnitř místností (hlavní dům, Pavlův byt, Byt 1, Byt 2, dílna, hospoda U Zámku, pekárna Křížkovi, Benapol, stavebniny, vinný sklep, sklad dílů).
* **Klobouky a okolí:** Ulice s názvy, náměstí Míru, zámek, kostely, park, hřiště, benzínka s tankováním a kanystry, autobusová linka 109 (včetně trasy na Hustopeče s Lidlem) a okolní silnice/pole.
* **Ekonomika, auta a policie:** Peníze a energie podle postavy, zakázky, krádeže a prodej aut, Simonův tuning i jízda v Golfu s turbem, odtahovka, systém hledanosti (hvězdy) a policejní zásahy.
* **Čas, počasí a ukládání:** Denní cyklus (1 den = 8 minut reálného času), střídání počasí, zvuky přes WebAudio a `sfx/`, velká mapa (`M`), ukládání postupu a spánek pro posun času.

## Ovládání
* **Pohyb a akce:** `WASD` + myš, `Shift` běh, `E` akce / interakce, `B` odhození nářadí nebo dílu, `G` nebo kliknutí použití nářadí, `R` vyproštění.
* **Postavy, mapa a zobrazení:** `Q` / `Tab` přepínání postav, `X` zvířata přes Terezu, `L` vodítko pro psy, `M` velká mapa a waypointy, `K` zakázky / úkoly, `F1` legenda, `O` kvalita grafiky, `Esc` pauza.
* **Auto:** `W`/`S` plyn a brzda, `A`/`D` zatáčení, `Mezerník` ruční brzda, `H` troubení, `Y` rádio, `U` turbo při jízdě Simona v Golfu.

## Soubory v projektu
* `index.html` – spuštění hry a rozhraní
* `game.js` – svět, interiéry, provoz, ekonomika, příběh a vykreslování
* `characters.js` – 3D modely postav a zvířat
* `simon-foto.js` – fotografie zaměstnance měsíce
* `sfx/` – zvukové efekty
* `CHANGELOG.md` – přehled změn a verzí
```[cite: 1, 2]
