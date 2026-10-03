# Oceaanquiz 🐋

Fotoquiz met 464 zeedieren: kies uit 4 namen, lees daarna feitjes en bekijk op een wereldkaart waar het dier voorkomt.

## Spelen
Dubbelklik op `index.html`. Werkt volledig offline (foto's in `images/`, kaarten in `maps/`, lettertypen in `fonts/`).

- **Spelmodi**: Klassiek (10/20/50/alle vragen, met uitleg na elk antwoord), Tijdrace (60 seconden), Overleven (3 levens).
- **Niveaus**: Makkelijk, Normaal, Moeilijk (lijkende namen, geen hint over de diergroep, dubbele punten).
- **Collectie**: elk dier dat je goed raadt, wordt "ontdekt" (teller rechtsboven, voortgang per diergroep).
- **Dierengids**: zoeken, filteren, sorteren; elk dier met foto, feitjes en verspreidingskaart.
- **Licht/donker thema** (volgt je systeem, of wissel met de knop rechtsboven).
- Toetsen `1`–`4` om te antwoorden, `Enter` om door te gaan, pijltjes in de gids.

Scores, collectie en instellingen worden in je browser bewaard.

## Bronnen
| Wat | Bron |
|---|---|
| Namen en feitjes | Nederlandstalige Wikipedia (CC BY-SA), via Wikidata gekoppeld |
| Foto's | iNaturalist (alleen open licenties) en Wikimedia Commons; maker en licentie staan bij elke foto |
| Kaarten | Waarnemingen uit GBIF.org (hexagon-dichtheidskaart) |

## Data opnieuw ophalen / dieren toevoegen
1. Voeg wetenschappelijke namen toe in `scraper/species.py`.
2. `pip install pillow` (eenmalig) en draai `python scraper/scrape.py`.

De scraper zoekt elke soort op in Wikidata, haalt het Nederlandse Wikipedia-artikel op en kiest de leukste zinnen als feitjes.
Per dier vergelijkt hij een iNaturalist- en een Commons-foto (resolutie, scherpte, levend dier i.p.v. museumexemplaar),
slaat de beste op als scherpe WebP van max. 1400 px en maakt een kaart van de GBIF-waarnemingen.
Alles wordt gecachet in `scraper/cache/` (mag je weggooien als je niet opnieuw wilt scrapen).
Soorten zonder Nederlands artikel of Nederlandse naam worden overgeslagen (zie `scraper/dropped.txt`).
