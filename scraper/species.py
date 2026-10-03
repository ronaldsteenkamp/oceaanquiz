# Zeedieren per categorie, op wetenschappelijke naam (Wikidata P225).
# Nederlandse naam, foto en feitjes worden door scrape.py opgehaald.

SPECIES = {
    "Zoogdieren": """
Balaenoptera musculus; Balaenoptera physalus; Balaenoptera borealis; Balaenoptera acutorostrata;
Balaenoptera edeni; Megaptera novaeangliae; Eschrichtius robustus; Balaena mysticetus;
Eubalaena glacialis; Eubalaena australis; Physeter macrocephalus; Kogia breviceps; Kogia sima;
Monodon monoceros; Delphinapterus leucas; Orcinus orca; Globicephala melas;
Globicephala macrorhynchus; Pseudorca crassidens; Grampus griseus; Tursiops truncatus;
Delphinus delphis; Stenella longirostris; Stenella coeruleoalba; Stenella frontalis;
Lagenorhynchus albirostris; Lagenorhynchus acutus; Lagenorhynchus obscurus;
Cephalorhynchus commersonii; Cephalorhynchus hectori; Sousa chinensis; Orcaella brevirostris;
Steno bredanensis; Phocoena phocoena; Phocoenoides dalli; Phocoena sinus; Ziphius cavirostris;
Hyperoodon ampullatus; Mesoplodon bidens; Berardius bairdii; Lissodelphis borealis;
Pontoporia blainvillei; Neophocaena phocaenoides; Phoca vitulina; Halichoerus grypus;
Pusa hispida; Pagophilus groenlandicus; Cystophora cristata; Erignathus barbatus;
Hydrurga leptonyx; Leptonychotes weddellii; Lobodon carcinophaga; Ommatophoca rossii;
Mirounga leonina; Mirounga angustirostris; Monachus monachus; Neomonachus schauinslandi;
Odobenus rosmarus; Zalophus californianus; Zalophus wollebaeki; Eumetopias jubatus;
Otaria flavescens; Arctocephalus pusillus; Arctocephalus gazella; Callorhinus ursinus;
Neophoca cinerea; Phocarctos hookeri; Histriophoca fasciata; Phoca largha; Enhydra lutris;
Lontra felina; Ursus maritimus; Trichechus manatus; Trichechus senegalensis; Dugong dugon
""",
    "Haaien & roggen": """
Carcharodon carcharias; Rhincodon typus; Cetorhinus maximus; Galeocerdo cuvier;
Carcharhinus leucas; Sphyrna mokarran; Sphyrna lewini; Sphyrna zygaena; Sphyrna tiburo;
Isurus oxyrinchus; Isurus paucus; Lamna nasus; Alopias vulpinus; Alopias pelagicus;
Prionace glauca; Carcharhinus longimanus; Carcharhinus melanopterus;
Carcharhinus amblyrhynchos; Carcharhinus limbatus; Carcharhinus falciformis;
Triaenodon obesus; Negaprion brevirostris; Ginglymostoma cirratum; Nebrius ferrugineus;
Stegostoma tigrinum; Stegostoma fasciatum; Orectolobus maculatus; Eucrossorhinus dasypogon;
Heterodontus portusjacksoni; Heterodontus francisci; Chiloscyllium punctatum;
Hemiscyllium ocellatum; Mitsukurina owstoni; Megachasma pelagios; Chlamydoselachus anguineus;
Hexanchus griseus; Notorynchus cepedianus; Somniosus microcephalus; Squalus acanthias;
Isistius brasiliensis; Scyliorhinus canicula; Scyliorhinus stellaris; Galeorhinus galeus;
Mustelus mustelus; Mustelus asterias; Carcharias taurus; Pristiophorus cirratus;
Squatina squatina; Cephaloscyllium ventriosum; Mobula birostris; Mobula alfredi;
Mobula mobular; Aetobatus narinari; Myliobatis aquila; Dasyatis pastinaca; Hypanus americanus;
Taeniura lymma; Taeniurops meyeni; Urobatis halleri; Raja clavata; Leucoraja naevus;
Dipturus batis; Torpedo marmorata; Torpedo torpedo; Pristis pectinata; Pristis pristis;
Rhynchobatus djiddensis; Rhina ancylostoma; Rhinoptera bonasus; Gymnura altavela;
Hydrolagus colliei; Chimaera monstrosa; Callorhinchus milii; Raja montagui; Raja brachyura
""",
    "Vissen": """
Thunnus thynnus; Thunnus albacares; Thunnus alalunga; Thunnus obesus; Katsuwonus pelamis;
Scomber scombrus; Sarda sarda; Xiphias gladius; Istiophorus platypterus; Makaira nigricans;
Kajikia audax; Coryphaena hippurus; Mola mola; Regalecus glesne; Lampris guttatus;
Paracanthurus hepatus; Zebrasoma flavescens; Acanthurus leucosternon; Naso lituratus;
Amphiprion ocellaris; Amphiprion percula; Amphiprion clarkii; Premnas biaculeatus;
Pterois volitans; Pterois miles; Pterois antennata; Dendrochirus zebra; Synanceia verrucosa;
Scorpaena scrofa; Rhinopias frondosa; Taenianotus triacanthus; Inimicus didactylus;
Antennarius maculatus; Antennarius commerson; Histrio histrio; Melanocetus johnsonii;
Lophius piscatorius; Hippocampus hippocampus; Hippocampus guttulatus; Hippocampus bargibanti;
Hippocampus kuda; Phycodurus eques; Phyllopteryx taeniolatus; Syngnathus acus;
Aeoliscus strigatus; Fistularia commersonii; Aulostomus maculatus; Ostracion cubicus;
Lactoria cornuta; Arothron hispidus; Arothron meleagris; Diodon holocanthus; Diodon hystrix;
Takifugu rubripes; Balistoides conspicillum; Rhinecanthus aculeatus; Odonus niger;
Balistes capriscus; Chaetodon auriga; Chaetodon lunula; Heniochus acuminatus;
Forcipiger flavissimus; Chelmon rostratus; Pomacanthus imperator; Pomacanthus paru;
Holacanthus ciliaris; Pygoplites diacanthus; Centropyge loricula; Cheilinus undulatus;
Labroides dimidiatus; Thalassoma bifasciatum; Coris gaimard; Bolbometopon muricatum;
Scarus guacamaia; Sparisoma cretense; Epinephelus lanceolatus; Epinephelus itajara;
Epinephelus marginatus; Cephalopholis miniata; Plectropomus leopardus;
Pseudanthias squamipinnis; Sphyraena barracuda; Caranx ignobilis; Caranx hippos;
Seriola lalandi; Echeneis naucrates; Remora remora; Gadus morhua; Melanogrammus aeglefinus;
Pollachius virens; Merlangius merlangus; Molva molva; Clupea harengus; Sardina pilchardus;
Engraulis encrasicolus; Sprattus sprattus; Pleuronectes platessa; Solea solea;
Scophthalmus maximus; Hippoglossus hippoglossus; Platichthys flesus; Limanda limanda;
Bothus lunatus; Anguilla anguilla; Conger conger; Gymnothorax javanicus; Gymnothorax funebris;
Gymnothorax favagineus; Echidna nebulosa; Rhinomuraena quaesita; Muraena helena;
Heteroconger hassi; Trachinus draco; Echiichthys vipera; Chelidonichthys lucerna; Zeus faber;
Dicentrarchus labrax; Sparus aurata; Mullus surmuletus; Labrus bergylta; Cyclopterus lumpus;
Anarhichas lupus; Myoxocephalus scorpius; Agonus cataphractus; Ammodytes tobianus;
Pholis gunnellus; Zoarces viviparus; Belone belone; Exocoetus volitans; Salmo salar;
Oncorhynchus nerka; Oncorhynchus tshawytscha; Acipenser sturio; Petromyzon marinus;
Myxine glutinosa; Latimeria chalumnae; Argyropelecus hemigymnus; Chauliodus sloani;
Eurypharynx pelecanoides; Macropinna microstoma; Anoplogaster cornuta; Psychrolutes marcidus;
Hoplostethus atlanticus; Chromis viridis; Dascyllus aruanus; Abudefduf saxatilis;
Gramma loreto; Synchiropus splendidus; Synchiropus picturatus; Nemateleotris magnifica;
Periophthalmus barbarus; Opistognathus aurifrons; Plotosus lineatus; Platax teira;
Platax pinnatus; Zanclus cornutus; Siganus vulpinus; Lutjanus kasmira; Lutjanus campechanus;
Lutjanus sebae; Oxycirrhites typus; Uranoscopus scaber; Trachurus trachurus; Mugil cephalus;
Chelon labrosus; Atherina presbyter; Gasterosteus aculeatus; Spinachia spinachia;
Sebastes norvegicus; Callionymus lyra; Gobius niger; Pomatoschistus minutus;
Liparis liparis; Lepadogaster lepadogaster; Dactylopterus volitans; Hippoglossoides platessoides
""",
    "Reptielen": """
Chelonia mydas; Caretta caretta; Dermochelys coriacea; Eretmochelys imbricata;
Lepidochelys olivacea; Lepidochelys kempii; Natator depressus; Amblyrhynchus cristatus;
Crocodylus porosus; Laticauda colubrina; Hydrophis platurus; Aipysurus laevis; Laticauda laticaudata
""",
    "Zeevogels": """
Aptenodytes forsteri; Aptenodytes patagonicus; Pygoscelis adeliae; Pygoscelis papua;
Pygoscelis antarcticus; Spheniscus demersus; Spheniscus humboldti; Spheniscus mendiculus;
Spheniscus magellanicus; Eudyptes chrysocome; Eudyptes chrysolophus; Eudyptula minor;
Megadyptes antipodes; Diomedea exulans; Phoebastria immutabilis; Thalassarche melanophris;
Fratercula arctica; Fratercula cirrhata; Alca torda; Uria aalge; Alle alle; Morus bassanus;
Sula nebouxii; Sula sula; Sula dactylatra; Fregata magnificens; Phaethon aethereus;
Pelecanus occidentalis; Gulosus aristotelis; Fulmarus glacialis; Puffinus puffinus;
Ardenna grisea; Hydrobates pelagicus; Oceanites oceanicus; Sterna paradisaea; Sterna hirundo;
Thalasseus sandvicensis; Rissa tridactyla; Larus argentatus; Larus marinus; Stercorarius skua;
Macronectes giganteus; Somateria mollissima; Cepphus grylle
""",
    "Weekdieren": """
Octopus vulgaris; Enteroctopus dofleini; Hapalochlaena lunulata; Hapalochlaena maculosa;
Thaumoctopus mimicus; Amphioctopus marginatus; Argonauta argo; Grimpoteuthis;
Vampyroteuthis infernalis; Architeuthis dux; Mesonychoteuthis hamiltoni; Dosidicus gigas;
Loligo vulgaris; Todarodes sagittatus; Sepia officinalis; Sepia apama; Metasepia pfefferi;
Sepiola atlantica; Euprymna scolopes; Nautilus pompilius; Spirula spirula; Tridacna gigas;
Tridacna maxima; Mytilus edulis; Ostrea edulis; Magallana gigas; Crassostrea gigas;
Cerastoderma edule; Ensis leei; Ensis directus; Pecten maximus; Aequipecten opercularis;
Pinna nobilis; Pinctada margaritifera; Teredo navalis; Buccinum undatum; Littorina littorea;
Patella vulgata; Haliotis tuberculata; Haliotis rufescens; Conus geographus; Conus textile;
Charonia tritonis; Cypraea tigris; Aliger gigas; Murex pecten; Janthina janthina;
Glaucus atlanticus; Aplysia punctata; Aplysia californica; Elysia chlorotica;
Hexabranchus sanguineus; Edmundsella pedata; Clione limacina; Katharina tunicata;
Cryptochiton stelleri; Crepidula fornicata; Nucella lapillus; Mya arenaria; Macoma balthica;
Arctica islandica; Tritonia hombergii; Facelina bostoniensis; Limacia clavigera
""",
    "Kreeftachtigen & co": """
Homarus gammarus; Homarus americanus; Palinurus elephas; Panulirus argus; Scyllarides latus;
Scyllarus arctus; Nephrops norvegicus; Cancer pagurus; Carcinus maenas; Callinectes sapidus;
Macrocheira kaempferi; Paralithodes camtschaticus; Birgus latro; Pagurus bernhardus;
Necora puber; Maja squinado; Maja brachydactyla; Ranina ranina; Lybia tessellata;
Odontodactylus scyllarus; Squilla mantis; Crangon crangon; Palaemon serratus;
Stenopus hispidus; Lysmata amboinensis; Hymenocera picta; Alpheus heterochaelis;
Euphausia superba; Meganyctiphanes norvegica; Calanus finmarchicus; Semibalanus balanoides;
Pollicipes pollicipes; Lepas anatifera; Bathynomus giganteus; Ligia oceanica;
Cymothoa exigua; Phronima sedentaria; Limulus polyphemus; Tachypleus tridentatus;
Grapsus grapsus; Ocypode quadrata; Hyas araneus; Corystes cassivelaunus; Galathea strigosa;
Porcellana platycheles; Caprella linearis; Gecarcoidea natalis
""",
    "Kwallen & koralen": """
Aurelia aurita; Cyanea capillata; Cyanea lamarckii; Chrysaora hysoscella; Chrysaora fuscescens;
Rhizostoma pulmo; Rhizostoma octopus; Cotylorhiza tuberculata; Pelagia noctiluca;
Cassiopea andromeda; Chironex fleckeri; Carukia barnesi; Turritopsis dohrnii;
Physalia physalis; Velella velella; Porpita porpita; Phyllorhiza punctata; Mastigias papua;
Stomolophus meleagris; Periphylla periphylla; Stygiomedusa gigantea; Atolla wyvillei;
Aequorea victoria; Actinia equina; Metridium senile; Metridium dianthus; Anemonia viridis;
Urticina felina; Heteractis magnifica; Stichodactyla gigantea; Entacmaea quadricolor;
Cerianthus membranaceus; Sagartia elegans; Acropora cervicornis; Acropora palmata;
Desmophyllum pertusum; Lophelia pertusa; Corallium rubrum; Tubastraea coccinea;
Alcyonium digitatum; Gorgonia ventalina; Paramuricea clavata; Millepora alcicornis;
Pennatula phosphorea; Pseudodiploria strigosa; Heliopora coerulea; Pocillopora damicornis;
Porites lobata; Dendrogyra cylindrus; Tubularia indivisa
""",
    "Stekelhuidigen": """
Asterias rubens; Acanthaster planci; Linckia laevigata; Protoreaster nodosus;
Pisaster ochraceus; Crossaster papposus; Culcita novaeguineae; Pycnopodia helianthoides;
Marthasterias glacialis; Astropecten irregularis; Echinus esculentus; Paracentrotus lividus;
Strongylocentrotus purpuratus; Strongylocentrotus droebachiensis; Diadema setosum;
Diadema antillarum; Heterocentrotus mamillatus; Tripneustes gratilla; Echinocardium cordatum;
Echinarachnius parma; Psammechinus miliaris; Holothuria forskali; Thelenota ananas;
Holothuria scabra; Scotoplanes globosa; Enypniastes eximia; Ophiothrix fragilis;
Ophiura ophiura; Astrophyton muricatum; Antedon bifida; Asterina gibbosa; Henricia sanguinolenta
""",
    "Overige ongewervelden": """
Spongia officinalis; Euplectella aspergillum; Xestospongia muta; Cliona celata;
Halichondria panicea; Arenicola marina; Hediste diversicolor; Alitta virens; Sabella pavonina;
Spirobranchus giganteus; Eunice aphroditois; Aphrodita aculeata; Riftia pachyptila;
Hermodice carunculata; Lineus longissimus; Pseudoceros dimidiatus; Bonellia viridis;
Ciona intestinalis; Pyrosoma atlanticum; Salpa maxima; Botryllus schlosseri;
Clavelina lepadiformis; Polycarpa aurata; Branchiostoma lanceolatum; Mnemiopsis leidyi;
Beroe cucumis; Pleurobrachia pileus; Lanice conchilega; Sabellaria spinulosa;
Lepidonotus squamatus; Sipunculus nudus; Electra pilosa; Membranipora membranacea
""",
}


def all_species():
    out = []
    for cat, block in SPECIES.items():
        for name in block.replace("\n", " ").split(";"):
            name = " ".join(name.split())
            if name:
                out.append((name, cat))
    return out
