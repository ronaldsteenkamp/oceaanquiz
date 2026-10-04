# Oceaanquiz 🐋

Fotoquiz met 464 zeedieren: herken het dier, lees feitjes en bekijk op een wereldkaart waar het voorkomt.

**Gemaakt door Ronald Steenkamp.**

## Spelen
**Online / op je telefoon:** https://ronaldsteenkamp.github.io/oceaanquiz/

- **Android (Chrome):** tik op *Installeer app* op de startpagina (of menu ⋮ → *App installeren*).
- **iPhone (Safari):** tik op *Deel* → *Zet op beginscherm*.
- Tik daarna op *Alles offline beschikbaar maken* om zonder internet te spelen.

**Op je pc:** dubbelklik op `index.html`.

## Wat zit erin
- **Dagelijkse uitdaging**: elke dag dezelfde 10 dieren voor iedereen, met een deelbare score (🟩🟥).
- **Oefenen**: herhaling op afstand. Dieren die je fout hebt komen meteen terug, goede pas na 1, 3, 7, 14 en 30 dagen.
- **Spelmodi**: Klassiek, Tijdrace (60 seconden) en Overleven (3 levens).
- **Vraagsoorten**: foto → naam, weetjes (raad het dier bij een opvallend feit), gemengd (ook naam → foto, weetjes en "welk dier leeft hier?" op de kaart) en intypen (expert, tikfouten toegestaan).
- **Niveaus**: Makkelijk, Normaal, Moeilijk (foute antwoorden uit dezelfde familie of met lijkende namen).
- **Noordzee-modus**: speel alleen met dieren die regelmatig in de Noordzee worden gezien.
- **Collectie**: elk dier dat je goed raadt wordt "ontdekt".
- **Dierengids**: zoeken, filteren (ook op Noordzee), meerdere foto's per dier, feitjes en verspreidingskaart.
- **Toegankelijk**: toetsenbord (`1`–`4`, `Enter`), meldingen voor schermlezers, licht/donker thema.

Scores, collectie en oefenvoortgang worden alleen in je browser bewaard.

## Bronnen
| Wat | Bron |
|---|---|
| Namen | Nederlandstalige Wikipedia, via Wikidata gekoppeld |
| Feitjes | Per dier herschreven uit het Wikipedia-artikel (`scraper/facts_curated.json`); elk feitje is terug te vinden in de bron |
| Foto's | iNaturalist (alleen open licenties, bij voorkeur zonder NC) en Wikimedia Commons; maker en licentie bij elke foto |
| Kaarten, familie, Noordzee | GBIF.org |

## Bijwerken
**Online versie bijwerken** na wijzigingen: `git add -A`, `git commit -m "..."`, `git push`.
Verhoog daarna `VERSION` in `sw.js` en de `?v=` in `index.html`, zodat geïnstalleerde apps de nieuwe versie ophalen.

**Data opnieuw ophalen / dieren toevoegen**
1. Voeg wetenschappelijke namen toe in `scraper/species.py`.
2. `pip install pillow` (eenmalig) en draai `python scraper/scrape.py`.
3. Nieuwe dieren krijgen automatisch gekozen feitjes; schrijf er eventueel zelf betere bij in `scraper/facts_curated.json`.

De scraper zoekt elke soort op in Wikidata en Wikipedia, kiest per dier de beste foto's (resolutie, scherpte, licentie),
maakt thumbnails, haalt familie en Noordzee-waarnemingen op bij GBIF en tekent de verspreidingskaart.
Alles wordt gecachet in `scraper/cache/` (mag je weggooien als je niet opnieuw wilt scrapen).
