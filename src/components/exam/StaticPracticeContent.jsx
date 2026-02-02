

export const staticContent = {
  reading: {
    finnish: {
      A1: [
        {
          text: "Tärkeä tiedote asukkaille. Talon sauna on pois käytöstä ensi viikon tiistaina 14. päivä huoltotöiden vuoksi. Sauna on suljettu koko päivän kello 8:00 ja 16:00 välillä. Pahoittelemme häiriötä. Ymmärryksestänne kiittäen, taloyhtiön hallitus.",
          questions: [
            { type: "multiple_choice", question: "Mikä on pois käytöstä?", options: ["Hissi", "Pesutupa", "Sauna"], correct_answer: "Sauna", explanation: "Tekstissä sanotaan 'Talon sauna on pois käytöstä'." },
            { type: "multiple_choice", question: "Milloin sauna on suljettu?", options: ["Maanantaina", "Tiistaina", "Keskiviikkona"], correct_answer: "Tiistaina", explanation: "Tekstissä sanotaan 'ensi viikon tiistaina'." },
            { type: "multiple_choice", question: "Miksi sauna on suljettu?", options: ["Siivouksen vuoksi", "Huoltötöiden vuoksi", "Asukaskokouksen vuoksi"], correct_answer: "Huoltötöiden vuoksi", explanation: "Tekstissä mainitaan syyksi 'huoltötöiden vuoksi'." }
          ]
        },
        {
          text: "Moi! Tässä helpon pastasalaatin ohje. Keitä 200 grammaa pastaa. Leikkaa yksi kurkku, kaksi tomaattia ja yksi paprika pieniksi paloiksi. Sekoita kaikki ainekset isossa kulhossa. Lisää kastikkeeksi oliiviöljyä ja vähän suolaa ja pippuria. Salaatti on valmis! Tämä resepti on nopea ja sopii hyvin lounaaksi tai päivälliseksi. Hyvää ruokahalua!",
          questions: [
            { type: "multiple_choice", question: "Mitä pitää keittää?", options: ["Riisiä", "Perunoita", "Pastaa"], correct_answer: "Pastaa", explanation: "Ohjeessa sanotaan 'Keitä 200 grammaa pastaa'." },
            { type: "multiple_choice", question: "Mitä vihanneksia salaattiin tulee?", options: ["Kurkku, tomaatti ja paprika", "Porkkana, sipuli ja selleri", "Peruna, maissi ja herne"], correct_answer: "Kurkku, tomaatti ja paprika", explanation: "Ohjeessa luetellaan kurkku, tomaatti ja paprika." },
            { type: "multiple_choice", question: "Mitä lisätään kastikkeeksi?", options: ["Majoneesia ja ketsuppia", "Oliiviöljyä ja mausteita", "Jogurttia ja sitruunamehua"], correct_answer: "Oliiviöljyä ja mausteita", explanation: "Ohjeessa neuvotaan lisäämään 'oliiviöljyä ja vähän suolaa ja pippuria'." }
          ]
        },
        {
          text: "Kauppa-ilmoitus: Aleksin Marketti. Tuoreita hedelmiä ja vihanneksia joka päivä! Omenat 2,50€/kg, banaanit 1,80€/kg, tomaatit 3,20€/kg. Leivät -20% alennuksessa perjantaisin. Avoinna ma-pe 7-21, la-su 8-20. Tervetuloa ostoksille! Osoite: Keskuskatu 15.",
          questions: [
            { type: "multiple_choice", question: "Paljonko omenat maksavat?", options: ["1,80€/kg", "2,50€/kg", "3,20€/kg"], correct_answer: "2,50€/kg", explanation: "Ilmoituksessa lukee 'Omenat 2,50€/kg'." },
            { type: "multiple_choice", question: "Milloin leivät ovat alennuksessa?", options: ["Maanantaisin", "Perjantaisin", "Sunnuntaisin"], correct_answer: "Perjantaisin", explanation: "Tekstissä sanotaan 'Leivät -20% alennuksessa perjantaisin'." },
            { type: "multiple_choice", question: "Mihin aikaan kauppa on auki lauantaisin?", options: ["7-21", "8-20", "9-18"], correct_answer: "8-20", explanation: "Aukioloajat: ma-pe 7-21, la-su 8-20." }
          ]
        },
        {
          text: "Kirjasto-ilmoitus: Tampereen kaupunginkirjasto. Uudet aukioloajat: Ma-To 9-20, Pe 9-18, La 10-16. Kirjoja voi lainata 4 viikoksi. Myöhästymismaksu 0,50€ per päivä. Lainakortin saa henkilötodistuksella. Internetiä voi käyttää ilmaiseksi. Kahvila avoinna arkisin 10-16. Lisätietoja: www.tampere.fi/kirjasto",
          questions: [
            { type: "multiple_choice", question: "Kuinka kauan kirjoja voi lainata?", options: ["2 viikkoa", "3 viikkoa", "4 viikkoa"], correct_answer: "4 viikkoa", explanation: "Tekstissä sanotaan 'Kirjoja voi lainata 4 viikoksi'." },
            { type: "multiple_choice", question: "Paljonko myöhästymismaksu on?", options: ["0,30€", "0,50€", "1,00€"], correct_answer: "0,50€", explanation: "Myöhästymismaksu on 0,50€ per päivä." },
            { type: "multiple_choice", question: "Milloin kahvila on auki?", options: ["Arkisin 10-16", "Viikonloppuisin", "Aina kun kirjasto on auki"], correct_answer: "Arkisin 10-16", explanation: "Tekstissä lukee 'Kahvila avoinna arkisin 10-16'." }
          ]
        },
        {
          text: "Sää tänään: Helsingissä aurinkoista, 18 astetta. Tuulee heikosti etelästä. Iltapäivällä pilviä lisää, mutta ei sadetta. Huomenna lauantaina sateinen, 12-15 astetta. Sunnuntaina pilvistä, 16 astetta. Viikonloppu sopii hyvin sisäaktiviteetteihin. Muistakaa ottaa sateenvarjo mukaan lauantaina!",
          questions: [
            { type: "multiple_choice", question: "Mikä on tämän päivän lämpötila?", options: ["15 astetta", "18 astetta", "20 astetta"], correct_answer: "18 astetta", explanation: "Tekstissä sanotaan 'Helsingissä aurinkoista, 18 astetta'." },
            { type: "multiple_choice", question: "Millainen sää on huomenna?", options: ["Aurinkoinen", "Pilvinen", "Sateinen"], correct_answer: "Sateinen", explanation: "Huomenna lauantaina on sateinen." },
            { type: "multiple_choice", question: "Mitä kannattaa ottaa mukaan lauantaina?", options: ["Aurinkolasit", "Sateenvarjo", "Lämpimät vaatteet"], correct_answer: "Sateenvarjo", explanation: "Tekstin lopussa kehotetaan: 'Muistakaa ottaa sateenvarjo mukaan lauantaina!'." }
          ]
        },
        {
          text: "Bussiaikataulut: Linja 1 keskustasta lentokentälle. Ma-Pe: lähdöt tasatunnein 6-22. Viikonloppuisin: lähdöt parillisina tunteina 8-20. Matka-aika 45 minuuttia. Lipun hinta: aikuinen 4,50€, lapsi 2,20€, eläkeläinen 3,00€. Kuukausilippu 89€. Liput ostetaan kuljettajalta tai mobiilisovelluksella.",
          questions: [
            { type: "multiple_choice", question: "Kuinka usein bussi lähtee arkisin?", options: ["Joka tunti", "Joka toinen tunti", "Kolme kertaa tunnissa"], correct_answer: "Joka tunti", explanation: "Arkisin lähdöt ovat tasatunnein." },
            { type: "multiple_choice", question: "Paljonko aikuisen lippu maksaa?", options: ["3,00€", "4,50€", "89€"], correct_answer: "4,50€", explanation: "Lipun hinta aikuiselle on 4,50€." },
            { type: "multiple_choice", question: "Kuinka kauan matka kestää?", options: ["30 minuuttia", "45 minuuttia", "60 minuuttia"], correct_answer: "45 minuuttia", explanation: "Matka-aika on 45 minuuttia." }
          ]
        },
        {
          text: "Uimahalli-ilmoitus: Itäkeskuksen uimahalli remontoituu elokuussa. Uimahalli on kiinni 2.-30.8. Väliaikaisesti voi uida Myllypuron uimahallissa. Kausiliput kelpaavat molemmissa paikoissa. Ryhmätunnit jatkuvat syyskuussa normaalisti. Pahoittelemme häiriötä ja kiitämme kärsivällisyydestänne!",
          questions: [
            { type: "multiple_choice", question: "Miksi uimahalli on kiinni?", options: ["Remontin vuoksi", "Loman vuoksi", "Henkilökunnan puutteen vuoksi"], correct_answer: "Remontin vuoksi", explanation: "Uimahalli remontoituu elokuussa." },
            { type: "multiple_choice", question: "Missä voi uida väliaikaisesti?", options: ["Itäkeskuksessa", "Myllypurossa", "Ei missään"], correct_answer: "Myllypurossa", explanation: "Väliaikaisesti voi uida Myllypuron uimahallissa." },
            { type: "multiple_choice", question: "Milloin ryhmätunnit jatkuvat?", options: ["Elokuussa", "Syyskuussa", "Lokakuussa"], correct_answer: "Syyskuussa", explanation: "Ryhmätunnit jatkuvat syyskuussa normaalisti." }
          ]
        },
        {
          text: "Postiin jäänyt paketti: Hyvä asiakas! Sinulle on saapunut paketti, joka ei mahtunut postilaatikkoon. Paketti odottaa noutoa Kampin postissa. Aukioloajat: Ma-Pe 8-18, La 9-15. Ota mukaan henkilötodistus ja noutkoodi 4567. Paketti säilytetään 14 päivää. Sen jälkeen se palautetaan lähettäjälle.",
          questions: [
            { type: "multiple_choice", question: "Missä paketti odottaa?", options: ["Kampin postissa", "Kotona", "Keskuspostissa"], correct_answer: "Kampin postissa", explanation: "Paketti odottaa noutoa Kampin postissa." },
            { type: "multiple_choice", question: "Mikä on noutkoodi?", options: ["1234", "4567", "7890"], correct_answer: "4567", explanation: "Noutkoodi on 4567." },
            { type: "multiple_choice", question: "Kuinka kauan paketti säilytetään?", options: ["7 päivää", "14 päivää", "30 päivää"], correct_answer: "14 päivää", explanation: "Paketti säilytetään 14 päivää." }
          ]
        },
        {
          text: "Ravintola-arvostelu: Kävin eilen uudessa pizzeriassa Punavuoressa. Ruoka oli todella hyvää ja henkilökunta ystävällistä. Pizza margherita maksoi 12€ ja oli iso. Ravintola oli siisti ja tunnelma mukava. Suosittelen erityisesti kinkkupizzaa! Ainoa miinus oli, että piti odottaa 25 minuuttia. Menen varmasti uudelleen!",
          questions: [
            { type: "multiple_choice", question: "Millaiseksi kirjoittaja kuvaa ruokaa?", options: ["Huonoksi", "Hyväksi", "Keskinkertaiseksi"], correct_answer: "Hyväksi", explanation: "Kirjoittaja sanoi että ruoka oli todella hyvää." },
            { type: "multiple_choice", question: "Paljonko pizza margherita maksoi?", options: ["10€", "12€", "15€"], correct_answer: "12€", explanation: "Pizza margherita maksoi 12€." },
            { type: "multiple_choice", question: "Mikä oli ainoa ongelma?", options: ["Huono ruoka", "Pitkä odotusaika", "Korkea hinta"], correct_answer: "Pitkä odotusaika", explanation: "Piti odottaa 25 minuuttia." }
          ]
        },
        {
          text: "Kerhotiedote: Valokuvauskerho kokoontuu joka toinen keskiviikko klo 18 Kulttuuritalossa. Seuraava tapaaminen 15.6. Aiheena on muotokuvaustekniikka. Opetamme myös kuvankäsittelyä tietokoneella. Jäsenmaksu 25€ vuodessa. Kaikki tasot tervetulleita! Ota mukaan oma kamera. Ilmoittaudu: valokuvakerho@email.fi",
          questions: [
            { type: "multiple_choice", question: "Kuinka usein kerho kokoontuu?", options: ["Joka viikko", "Joka toinen viikko", "Kerran kuussa"], correct_answer: "Joka toinen viikko", explanation: "Kerho kokoontuu joka toinen keskiviikko." },
            { type: "multiple_choice", question: "Paljonko jäsenmaksu on?", options: ["15€", "25€", "35€"], correct_answer: "25€", explanation: "Jäsenmaksu on 25€ vuodessa." },
            { type: "multiple_choice", question: "Mitä seuraavassa tapaamisessa opetetaan?", options: ["Maisemakuvausta", "Muotokuvaustekniikkaa", "Eläinkuvausta"], correct_answer: "Muotokuvaustekniikkaa", explanation: "Aiheena on muotokuvaustekniikka." }
          ]
        },
        {
          text: "Lääkäriajan muistutus: Hyvä Anna Virtanen! Muistutamme lääkärinajastanne huomenna torstaina 10.6. klo 14:30. Lääkäri: Dr. Mäkinen, Terveystalo Kamppi, 3. krs, huone 305. Ota mukaan Kela-kortti ja henkilötodistus. Jos et pääse tulemaan, peru aika vähintään 2 tuntia etukäteen numerosta 010-12345.",
          questions: [
            { type: "multiple_choice", question: "Mihin aikaan aika on?", options: ["14:00", "14:30", "15:00"], correct_answer: "14:30", explanation: "Aika on klo 14:30." },
            { type: "multiple_choice", question: "Missä vastaanotto sijaitsee?", options: ["2. kerroksessa", "3. kerroksessa", "4. kerroksessa"], correct_answer: "3. kerroksessa", explanation: "Vastaanotto on 3. kerroksessa, huoneessa 305." },
            { type: "multiple_choice", question: "Kuinka etukäteen aika pitää perua?", options: ["1 tunti", "2 tuntia", "24 tuntia"], correct_answer: "2 tuntia", explanation: "Aika pitää perua vähintään 2 tuntia etukäteen." }
          ]
        },
        {
          text: "Opiskelija-asunnon ilmoitus: Vuokrataan yksiö Otaniemessä. 28 m², 3. krs, hissi. Vuokra 650€/kk + sähkö 30€/kk. Kalustettu: sänky, pöytä, tuoli, kaappi. Keittiössä liesi ja jääkaappi. Bussi kulkee Aalto-yliopistoon 5 minuutissa. Vuokrasopimus vähintään 6 kuukaudeksi. Ota yhteyttä: +358 40 123 4567.",
          questions: [
            { type: "multiple_choice", question: "Kuinka iso huoneisto on?", options: ["25 m²", "28 m²", "30 m²"], correct_answer: "28 m²", explanation: "Yksiö on 28 m²." },
            { type: "multiple_choice", question: "Paljonko vuokra on yhteensä kuukaudessa?", options: ["650€", "680€", "720€"], correct_answer: "680€", explanation: "Vuokra 650€ + sähkö 30€ = 680€ yhteensä." },
            { type: "multiple_choice", question: "Kuinka kauan vuokrasopimus on vähintään?", options: ["3 kuukautta", "6 kuukautta", "12 kuukautta"], correct_answer: "6 kuukautta", explanation: "Vuokrasopimus on vähintään 6 kuukaudeksi." }
          ]
        },
        {
          text: "Kuntosali-ilmoitus: FitCenter avaa uuden salin Espooseen! Avajaistarjous: 3 kk jäsenyys vain 99€ (norm. 150€). Modernit laitteet, ryhmätunnit sisältyvä hintaan. Avoinna 24/7. Personal trainer -palvelut alkaen 45€/h. Ilmainen kehonkoostumusmittaus uusille jäsenille. Liity nyt: www.fitcenter.fi tai soita 09-12345678.",
          questions: [
            { type: "multiple_choice", question: "Paljonko avajaistarjous maksaa?", options: ["99€", "150€", "45€"], correct_answer: "99€", explanation: "Avajaistarjous on 99€ kolmeksi kuukaudeksi." },
            { type: "multiple_choice", question: "Mihin aikaan sali on auki?", options: ["6-22", "24/7", "7-23"], correct_answer: "24/7", explanation: "Sali on avoinna 24/7 eli ympäri vuorokauden." },
            { type: "multiple_choice", question: "Mitä uudet jäsenet saavat ilmaiseksi?", options: ["Personal trainer -tunnin", "Kehonkoostumusmittauksen", "Ryhmätunnin"], correct_answer: "Kehonkoostumusmittauksen", explanation: "Ilmainen kehonkoostumusmittaus uusille jäsenille." }
          ]
        },
        {
          text: "Kirpputorimyynti: Iso kirpputorimyynti lauantaina 20.5. klo 10-16 Töölön torilla. Myydään: vaatteita, kirjoja, leluja, astioita ja huonekaluja. Kaikki tavarat hyvässä kunnossa ja edullisesti! Kahvia ja munkkeja myynnissä. Maksu vain käteisellä. Myynti toteutetaan, jos ei sada. Myyjät tervetulleita, pöytävuokra 10€.",
          questions: [
            { type: "multiple_choice", question: "Milloin kirpputorimyynti on?", options: ["Perjantaina", "Lauantaina", "Sunnuntaina"], correct_answer: "Lauantaina", explanation: "Kirpputorimyynti on lauantaina 20.5." },
            { type: "multiple_choice", question: "Miten voi maksaa?", options: ["Kortilla", "Käteisellä", "Molemmilla"], correct_answer: "Käteisellä", explanation: "Maksu vain käteisellä." },
            { type: "multiple_choice", question: "Paljonko pöytävuokra on?", options: ["5€", "10€", "15€"], correct_answer: "10€", explanation: "Pöytävuokra on 10€." }
          ]
        },
        {
          text: "Kesätyöilmoitus: Haemme reipasta kesätyöntekijää puutarhaliikkeeseen touko-elokuulle. Työtehtävät: asiakaspalvelu, kasvien hoito, tavaroiden järjestely. Kokemus ei välttämätön, opetamme työt. Työaika: ma-pe 8-16, lauantaisin 9-15. Palkka 12€/h. Hakemus osoitteeseen: kesatyo@puutarha.fi. Hakuaika päättyy 30.4.",
          questions: [
            { type: "multiple_choice", question: "Kuinka kauan kesätyö kestää?", options: ["3 kuukautta", "4 kuukautta", "5 kuukautta"], correct_answer: "4 kuukautta", explanation: "Työ on touko-elokuulle, eli 4 kuukautta." },
            { type: "multiple_choice", question: "Paljonko tuntilikka on?", options: ["10€", "12€", "15€"], correct_answer: "12€", explanation: "Palkka on 12€/h." },
            { type: "multiple_choice", question: "Milloin hakuaika päättyy?", options: ["30.4.", "31.5.", "30.6."], correct_answer: "30.4.", explanation: "Hakuaika päättyy 30.4." }
          ]
        },
        {
          text: "Elokuvateatteri-ohjelma: Rex-elokuvateatterissa tällä viikolla: Ma-Ti 'Kesärakkautta' klo 18 ja 20:30. Ke-To 'Toimintaelokuva' klo 17, 19:30 ja 22. Pe-Su 'Lasten elokuva' klo 15 ja 17, 'Draama' klo 19:30 ja 22. Liput: aikuinen 12€, lapsi 8€, eläkeläinen 10€. Verkkokaupasta 1€ alennus.",
          questions: [
            { type: "multiple_choice", question: "Mitä elokuvaa näytetään maanantaina?", options: ["Toimintaelokuva", "Kesärakkautta", "Draama"], correct_answer: "Kesärakkautta", explanation: "Ma-Ti näytetään 'Kesärakkautta'." },
            { type: "multiple_choice", question: "Paljonko lapsen lippu maksaa?", options: ["8€", "10€", "12€"], correct_answer: "8€", explanation: "Lapsen lippu maksaa 8€." },
            { type: "multiple_choice", question: "Paljonko säästää ostamalla netistä?", options: ["50 senttiä", "1€", "2€"], correct_answer: "1€", explanation: "Verkkokaupasta saa 1€ alennuksen." }
          ]
        },
        {
          text: "Kadonneen kissan ilmoitus: Kissa kateissa! Pieni ruskea kissa nimeltä Mirri katosi Puistolan alueelta 12.5. Kissalla on vihreät silmät ja valkoinen täplä rinnassa. Hyvin kiltti ja ihmiselle tottunut. Jos näet Mirrin, ota yhteyttä: Liisa 050-1234567. Löytäjälle kiitospalkinto 50€. Olemme todella huolissamme!",
          questions: [
            { type: "multiple_choice", question: "Mikä on kissan nimi?", options: ["Milli", "Mirri", "Mimmi"], correct_answer: "Mirri", explanation: "Kissan nimi on Mirri." },
            { type: "multiple_choice", question: "Minkä väriset silmät kissalla on?", options: ["Siniset", "Ruskeat", "Vihreät"], correct_answer: "Vihreät", explanation: "Kissalla on vihreät silmät." },
            { type: "multiple_choice", question: "Paljonko löytäjälle maksetaan?", options: ["30€", "50€", "100€"], correct_answer: "50€", explanation: "Löytäjälle kiitospalkinto 50€." }
          ]
        },
        {
          text: "Tanssikurssi-ilmoitus: Latinotanssikurssi aloittelijoille alkaa 1.6. Opetamme salsa-, bachata- ja cha-cha-tansseja. Kurssikerta keskiviikkoisin klo 19-20:30 Tanssi-studiossa. Kurssi kestää 8 viikkoa, hinta 120€. Parin kanssa 200€. Mukava opettaja ja rento tunnelma! Ilmoittautuminen: info@tanssistudio.fi tai puh. 040-9876543.",
          questions: [
            { type: "multiple_choice", question: "Milloin kurssi alkaa?", options: ["1.5.", "1.6.", "1.7."], correct_answer: "1.6.", explanation: "Kurssi alkaa 1.6." },
            { type: "multiple_choice", question: "Kuinka kauan kurssi kestää?", options: ["6 viikkoa", "8 viikkoa", "10 viikkoa"], correct_answer: "8 viikkoa", explanation: "Kurssi kestää 8 viikkoa." },
            { type: "multiple_choice", question: "Paljonko parin kanssa maksaa?", options: ["120€", "200€", "240€"], correct_answer: "200€", explanation: "Parin kanssa kurssi maksaa 200€." }
          ]
        },
        {
          text: "Autokouluilmoitus: Aja-Opi Autokoulu tarjoaa ajokorttikursseja ympäri vuoden. B-kortin hinta 1200€, sisältää teoriaopetuksen ja 20 ajotuntia. Lisätunnit 45€/kpl. Teoriakokeeseen valmennusta ilmaiseksi. Ajotunnit arkisin 8-20, viikonloppuisin 9-16. Maksu erissä mahdollinen. Aloita heti! Puh: 09-11111111",
          questions: [
            { type: "multiple_choice", question: "Paljonko B-ajokortti maksaa?", options: ["1000€", "1200€", "1500€"], correct_answer: "1200€", explanation: "B-kortin hinta on 1200€." },
            { type: "multiple_choice", question: "Montako ajotuntia hintaan sisältyy?", options: ["15", "20", "25"], correct_answer: "20", explanation: "Hintaan sisältyy 20 ajotuntia." },
            { type: "multiple_choice", question: "Paljonko lisätunti maksaa?", options: ["35€", "45€", "55€"], correct_answer: "45€", explanation: "Lisätunnit maksavat 45€/kpl." }
          ]
        }
      ],
      A2: [
        {
          text: "Suomalaisten kesälomatottumukset ovat muuttuneet viime vuosina. Yhä useampi suosii kotimaanmatkailua ulkomaanmatkojen sijaan. Erityisesti kansallispuistot ja mökkilomat ovat nostaneet suosiotaan. Tämä johtuu osittain ympäristötietoisuuden kasvusta sekä halusta tukea paikallisia yrittäjiä. Kotimaanmatkailu tarjoaa myös mahdollisuuden nähdä ja kokea oman maan monipuolista luontoa ja kulttuuria. Monet perheet löytävät nyt uusia retkikohteita läheltä kotia.",
          questions: [
            { type: "multiple_choice", question: "Mikä on yleistynyt suomalaisten keskuudessa?", options: ["Ulkomaanmatkailu", "Kotimaanmatkailu", "Risteilyt"], correct_answer: "Kotimaanmatkailu", explanation: "Tekstin mukaan yhä useampi suosii kotimaanmatkailua." },
            { type: "multiple_choice", question: "Mitkä ovat suosittuja kotimaan kohteita?", options: ["Kaupunkihotellit", "Kansallispuistot ja mökit", "Kylpylät"], correct_answer: "Kansallispuistot ja mökit", explanation: "Tekstissä mainitaan, että erityisesti kansallispuistot ja mökkilomat ovat nostaneet suosiotaan." },
            { type: "multiple_choice", question: "Mikä EI ole syy kotimaanmatkailun suosioon tekstin mukaan?", options: ["Ympäristötietoisuus", "Paikallisten yrittäjien tukeminen", "Halvemmat hinnat"], correct_answer: "Halvemmat hinnat", explanation: "Teksti mainitsee syiksi ympäristötietoisuuden ja paikallisten yrittäjien tukemisen, mutta ei hintoja." }
          ]
        }
      ],
      B1: [
        {
          text: "Helsingin kaupunki järjestää jälleen suositun Siivouspäivä-tapahtuman tulevana lauantaina. Siivouspäivä on kaupunkitapahtuma, joka muuttaa kaupungin yhdeksi suureksi kirpputoriksi ja kierrätysjuhlaksi. Kuka tahansa voi perustaa oman myyntipisteen ja myydä tarpeettomia tavaroitaan puistossa, kadulla tai omalla pihallaan. Tapahtuman tavoitteena on edistää kestävää kehitystä, kierrätystä ja yhteisöllisyyttä. Osallistuminen on ilmaista, mutta myyjien on siivottava omat jälkensä päivän päätteeksi.",
          questions: [
            { type: "multiple_choice", question: "Mikä tapahtuma järjestetään lauantaina?", options: ["Musiikkifestivaali", "Urheilukilpailu", "Siivouspäivä"], correct_answer: "Siivouspäivä", explanation: "Tekstissä kerrotaan Siivouspäivä-tapahtumasta." },
            { type: "multiple_choice", question: "Mitä Siivouspäivänä voi tehdä?", options: ["Myydä vanhoja tavaroita", "Istuttaa kukkia", "Osallistua urheilukilpailuun"], correct_answer: "Myydä vanhoja tavaroita", explanation: "Tekstin mukaan kuka tahansa voi perustaa myyntipisteen ja myydä tavaroitaan." },
            { type: "multiple_choice", question: "Mikä on tapahtuman tavoite?", options: ["Kerätä rahaa hyväntekeväisyyteen", "Edistää kierrätystä ja yhteisöllisyyttä", "Mainostaa uusia tuotteita"], correct_answer: "Edistää kierrätystä ja yhteisöllisyyttä", explanation: "Tekstissä mainitaan tavoitteeksi kestävän kehityksen, kierrätyksen ja yhteisöllisyyden edistäminen." }
          ]
        }
      ],
      B2: []
    },
    swedish: {
      A1: [
        {
          text: "Viktig information till de boende. Tvättstugan kommer att vara stängd för underhåll nästa onsdag den 21:a. Tvättstugan är inte tillgänglig hela dagen, mellan klockan 9:00 och 17:00. Vi ber om ursäkt för besväret. Tack för din förståelse, styrelsen.",
          questions: [
            { type: "multiple_choice", question: "Vad kommer att vara stängt?", options: ["Hissen", "Gymmet", "Tvättstugan"], correct_answer: "Tvättstugan", explanation: "I texten står det 'Tvättstugan kommer att vara stängd'." },
            { type: "multiple_choice", question: "När är tvättstugan stängd?", options: ["Tisdag", "Onsdag", "Torsdag"], correct_answer: "Onsdag", explanation: "I texten står det 'nästa onsdag'." },
            { type: "multiple_choice", question: "Varför är den stängd?", options: ["På grund av en fest", "För städning", "För underhåll"], correct_answer: "För underhåll", explanation: "Texten anger anledningen som 'för underhåll'." }
          ]
        }
      ],
      A2: [
        {
          text: "Hej, jag heter Maja och jag letar efter en ny lägenhet i Stockholm. Jag bor just nu i en liten etta, men jag vill flytta till en större lägenhet med två rum och kök. Jag har tittat på många annonser på internet. Det är dyrt att bo i Stockholm, så det är svårt att hitta något som är både bra och billigt. Igår var jag på en visning i en lägenhet i Solna. Den var fin och hade en stor balkong, men hyran var för hög för mig. Jag ska fortsätta leta. Min vän säger att det är bra att också titta på lägenheter utanför centrum, till exempel i Sundbyberg eller Hammarby Sjöstad. Där kan priserna vara lite lägre. Jag hoppas att jag hittar något snart. Att ha ett eget, trevligt hem är viktigt för mig.",
          questions: [
            { type: "multiple_choice", question: "Varför vill Maja flytta?", options: ["Hon vill ha en billigare lägenhet", "Hon vill ha en större lägenhet", "Hon vill bo närmare sitt jobb"], correct_answer: "Hon vill ha en större lägenhet", explanation: "Texten säger att hon vill flytta till en 'större lägenhet med två rum och kök'." },
            { type: "multiple_choice", question: "Vad var problemet med lägenheten i Solna?", options: ["Den var för liten", "Den hade ingen balkong", "Hyran var för dyr"], correct_answer: "Hyran var för dyr", explanation: "Texten säger 'hyran var för hög för mig'." },
            { type: "multiple_choice", question: "Vilket råd gav Majas vän?", options: ["Att köpa en lägenhet istället för att hyra", "Att leta efter lägenheter utanför centrum", "Att renovera sin nuvarande lägenhet"], correct_answer: "Att leta efter lägenheter utanför centrum", explanation: "Vännen sa att det är bra att 'titta på lägenheter utanför centrum'." }
          ]
        },
        {
          text: "Att resa med tåg i Sverige är ett populärt och miljövänligt sätt att se landet. SJ är det största tågbolaget och erbjuder resor till de flesta städer, från Malmö i söder till Kiruna i norr. Man kan köpa biljetter online på deras hemsida, i deras app eller på stationen. Det är oftast billigare att boka sin resa i förväg. På tåget finns det vanligtvis Wi-Fi, eluttag och en bistro där man kan köpa kaffe, smörgåsar och fika. För längre resor, som nattåget till Norrland, kan man boka en sovplats i en sovkupé. Det är ett bekvämt sätt att resa långa sträckor.",
          questions: [
            { type: "multiple_choice", question: "När är det oftast billigare att köpa tågbiljetter?", options: ["Samma dag som resan", "På stationen", "I förväg"], correct_answer: "I förväg", explanation: "Texten säger 'Det är oftast billigare att boka sin resa i förväg'." },
            { type: "multiple_choice", question: "Vad kan man vanligtvis hitta på tåget?", options: ["En biograf", "Wi-Fi och en bistro", "Ett gym"], correct_answer: "Wi-Fi och en bistro", explanation: "Texten nämner 'Wi-Fi, eluttag och en bistro'." },
            { type: "multiple_choice", question: "Vad kan man boka för en lång nattresa?", options: ["Ett hotellrum", "En sovplats", "En sittplats i första klass"], correct_answer: "En sovplats", explanation: "För längre resor kan man 'boka en sovplats i en sovkupé'." }
          ]
        }
      ],
      B1: [
        {
          text: "Midsommar är en av de viktigaste högtiderna i Sverige. Den firas alltid på en fredag mellan den 19 och 25 juni. Många svenskar lämnar städerna och åker ut till landet för att fira med familj och vänner. En viktig tradition är att resa en midsommarstång, som man klär med löv och blommor. Man dansar runt stången och sjunger gamla sånger, som 'Små grodorna'. Maten är också viktig. På midsommarbordet finns ofta sill, färskpotatis med dill, gräddfil och gräslök. Till efterrätt äter man jordgubbar, ofta med grädde eller glass. Midsommar är en fest för att fira att sommaren och ljuset har kommit tillbaka efter den långa vintern.",
          questions: [
            { type: "multiple_choice", question: "När firas midsommar?", options: ["Alltid den 21 juni", "På en fredag mellan 19-25 juni", "Första helgen i juli"], correct_answer: "På en fredag mellan 19-25 juni", explanation: "Texten säger att det firas på en fredag mellan den 19 och 25 juni." },
            { type: "multiple_choice", question: "Vad gör många svenskar på midsommar?", options: ["Stannar i staden", "Åker utomlands", "Åker till landet"], correct_answer: "Åker till landet", explanation: "Många svenskar lämnar städerna och åker ut till landet." },
            { type: "multiple_choice", question: "Vilken mat är typisk för midsommar?", options: ["Köttbullar och mos", "Sill och färskpotatis", "Ärtsoppa och pannkakor"], correct_answer: "Sill och färskpotatis", explanation: "På midsommarbordet finns ofta sill, färskpotatis med dill." }
          ]
        }
      ],
      B2: []
    }
  },
  listening: {
    finnish: {
      A1: [
        {
          audio_script: "Radio-uutiset: 'Hyvää iltaa. Tänään Helsingissä on ollut aurinkoista säätä ja 22 astetta lämmintä. Huomenna tiistaina pilvet lisääntyvät ja lämpötila laskee 18 asteeseen. Viikonloppuna odotetaan sadekuuroja.'",
          scenario_description: "Kuuntelet radio-uutisia kotona.",
          questions: [
            { type: "multiple_choice", question: "Mikä on tämän päivän lämpötila Helsingissä?", options: ["18 astetta", "20 astetta", "22 astetta"], correct_answer: "22 astetta", explanation: "Uutisissa sanottiin '22 astetta lämmintä'." },
            { type: "multiple_choice", question: "Millainen sää on huomenna?", options: ["Aurinkoinen", "Pilvinen", "Sateinen"], correct_answer: "Pilvinen", explanation: "Uutisissa sanottiin 'pilvet lisääntyvät'." }
          ]
        }
      ],
      A2: [],
      B1: [],
      B2: []
    },
    swedish: {
      A1: [
        {
          audio_script: "Radionyheter: 'God kväll. Idag har det varit soligt väder i Stockholm med 24 grader. Imorgon onsdag blir det molnigt och temperaturen sjunker till 19 grader. Under helgen väntas regnskurar.'",
          scenario_description: "Du lyssnar på radionyheter hemma.",
          questions: [
            { type: "multiple_choice", question: "Vad är dagens temperatur i Stockholm?", options: ["19 grader", "21 grader", "24 grader"], correct_answer: "24 grader", explanation: "I nyheterna sades '24 grader'." },
            { type: "multiple_choice", question: "Hur blir vädret imorgon?", options: ["Soligt", "Molnigt", "Regnigt"], correct_answer: "Molnigt", explanation: "I nyheterna sades 'imorgon onsdag blir det molnigt'." }
          ]
        }
      ],
      A2: [],
      B1: [
        {
          audio_script: "Intervju med en student: 'Hej! Jag heter Alex och jag studerar ekonomi vid Stockholms universitet. Det är ganska tufft men intressant. Jag har föreläsningar tre dagar i veckan, och resten av tiden pluggar jag själv eller gör grupparbeten. Det bästa med universitetet är studentlivet. Det finns många föreningar och klubbar man kan gå med i. Jag är med i en sportklubb där vi spelar innebandy varje torsdag. Det är ett bra sätt att träffa nya människor och koppla av från studierna. I framtiden hoppas jag kunna jobba som ekonomikonsult på ett stort företag.'",
          scenario_description: "Du hör en intervju med en universitetsstudent.",
          questions: [
            { type: "multiple_choice", question: "Vad studerar Alex?", options: ["Juridik", "Teknik", "Ekonomi"], correct_answer: "Ekonomi", explanation: "Alex säger 'jag studerar ekonomi vid Stockholms universitet'." },
            { type: "multiple_choice", question: "Vad gör Alex på torsdagar?", options: ["Har föreläsningar", "Spelar innebandy", "Jobbar extra"], correct_answer: "Spelar innebandy", explanation: "Alex är med i en sportklubb där de spelar innebandy varje torsdag." }
          ]
        }
      ],
      B2: []
    }
  },
  writing: {
    finnish: {
      A1: [
        {
          tasks: [
            { type: "informal", prompt: "Kirjoita tekstiviesti ystävällesi ja kutsu hänet kahville huomenna.", word_count: "10-20 sanaa", sample_answer: "Moi! Mennäänkö huomenna kahville vaikka klo 14? T. [Oma Nimi]", comments: "Yksinkertainen kutsu, kohtelias sävy" }
          ]
        }
      ],
      A2: [],
      B1: [
        {
          tasks: [
            { type: "informal", prompt: "Kirjoita sähköposti ystävällesi. Kerro viikonloppusi suunnitelmista ja kysy hänen suunnitelmiaan.", word_count: "40-60 sanaa", sample_answer: "Moi [Ystävän Nimi],\nMiten menee? Ajattelin kertoa, että aion mennä lauantaina retkelle Nuuksion kansallispuistoon. Sunnuntaina aion vain rentoutua kotona. Mitä sinä aiot tehdä viikonloppuna? Olisi kiva kuulla!\nTerveisin,\n[Oma Nimi]", comments: "Ystävällinen sävy, selkeä rakenne, kysymyksiä mukana" }
          ]
        }
      ],
      B2: []
    },
    swedish: {
      A1: [
        {
          tasks: [
            { type: "informal", prompt: "Skriv ett textmeddelande till din vän och bjud in honom/henne på kaffe imorgon.", word_count: "10-20 ord", sample_answer: "Hej! Ska vi träffas och ta kaffe imorgon kanske kl 14? Hälsningar [Ditt namn]", comments: "Enkel inbjudan, vänlig ton" }
          ]
        }
      ],
      A2: [
        {
          tasks: [
            { type: "informal", prompt: "Skriv ett e-postmeddelande till din vän. Berätta om dina helgplaner och fråga om hans/hennes planer.", word_count: "40-60 ord", sample_answer: "Hej [Vännens namn],\nHur mår du? Jag tänkte berätta att jag ska åka på utflykt till Tyresta nationalpark på lördag. På söndag tänker jag bara vila hemma. Vad ska du göra under helgen? Det skulle vara kul att höra!\nHälsningar,\n[Ditt namn]", comments: "Vänlig ton, tydlig struktur, inkluderar frågor" }
          ]
        }
      ],
      B1: [
        {
          tasks: [
            { type: "formal", prompt: "Du köpte en dator från en webbutik, men den fungerar inte som den ska. Skriv ett reklamationsmail till kundtjänst. Beskriv problemet och kräv en lösning (ny dator eller pengarna tillbaka).", word_count: "60-80 ord", sample_answer: "Hej Kundtjänst,\n\nJag köpte en bärbar dator (Ordernr: 12345) från er webbutik förra veckan. Tyvärr har jag upptäckt ett problem med produkten. Skärmen blinkar och stängs av slumpmässigt. Jag har försökt starta om den, men problemet kvarstår.\n\nJag är mycket besviken eftersom jag behöver datorn för mitt arbete. Jag vill reklamera varan och önskar antingen få en ny, fungerande dator eller pengarna tillbaka så snart som möjligt.\n\nMed vänliga hälsningar,\n[Ditt Namn]", comments: "Formell ton, tydlig beskrivning av problemet och krav på åtgärd." },
            { type: "informal", prompt: "Du har flyttat till en ny lägenhet. Skriv ett brev till din vän och berätta om flytten, den nya lägenheten och grannskapet.", word_count: "60-80 ord", sample_answer: "Hej Anna!\n\nHoppas allt är bra med dig! Jag har äntligen flyttat till min nya lägenhet i Göteborg. Flytten var jobbig men det gick bra tack vare att mina föräldrar hjälpte till.\n\nLägenheten är jättefin, den är ljus och har en stor balkong. Området verkar lugnt och det finns en fin park precis bredvid. Jag trivs redan bra här. Du måste komma och hälsa på snart! När har du tid?\n\nKram,\n[Ditt Namn]", comments: "Personlig ton, beskrivande språk." }
          ]
        }
      ],
      B2: []
    }
  },
  speaking: {
    finnish: {
      A1: [
        {
          tasks: [
            { type: "description", prompt: "Kerro mitä teet tavallisesti aamulla ennen töihin menoa.", assessment: "Pyri käyttämään yksinkertaisia lauseita ja preesensiä. Mainitse toimintoja järjestyksessä.", sample_answer: "Aamulla herään kello seitsemän. Käyn suihkussa ja pesen hampaat. Syön aamiaista ja juon kahvia. Sitten lähden töihin bussilla." }
          ]
        }
      ],
      A2: [],
      B1: [],
      B2: []
    },
    swedish: {
      A1: [
        {
          tasks: [
            { type: "description", prompt: "Berätta vad du brukar göra på morgonen innan du går till jobbet.", assessment: "Försök använda enkla meningar och presens. Nämn aktiviteter i ordning.", sample_answer: "På morgonen vaknar jag klockan sju. Jag duschar och borstar tänderna. Jag äter frukost och dricker kaffe. Sen åker jag till jobbet med bussen." }
          ]
        }
      ],
      A2: [],
      B1: [
        {
          tasks: [
            { type: "description", prompt: "Berätta om en resa som du aldrig glömmer. Vart åkte du? Vem reste du med? Vad hände?", assessment: "Använd imperfekt (dåtid) för att berätta om det förflutna. Beskriv känslor och upplevelser.", sample_answer: "Förra sommaren reste jag till Lofoten i Norge med min familj. Vi hyrde en bil och körde hela vägen. Naturen var fantastisk med höga berg och blått hav. Det var ljust dygnet runt eftersom det var midnattssol. En dag vandrade vi uppför ett berg och utsikten var otrolig. Det var den vackraste plats jag någonsin sett. Jag kommer aldrig att glömma den resan." }
          ]
        }
      ],
      B2: []
    }
  }
};
