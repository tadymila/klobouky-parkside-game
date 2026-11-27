# The Parkside

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
