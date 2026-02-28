// src/data/freeTestContent.js

export const FREE_TEST_CONTENT = {
  finnish: {
    reading: {
      title: "Kaupassa",
      text: `Maija menee kauppaan joka viikko. Hän ostaa yleensä leipää, maitoa ja vihanneksia.
Tänään kaupassa on ale: appelsiinit maksavat vain 1,50 euroa kilolta. Maija ottaa kaksi kiloa.
Kassalla hän maksaa kortilla. Kaikki maksaa yhteensä 18 euroa. Maija on tyytyväinen.`,
      questions: [
        {
          id: "fi_r1",
          question: "Kuinka usein Maija käy kaupassa?",
          options: ["Joka päivä", "Joka viikko", "Joka kuukausi", "Harvoin"],
          correct: 1
        },
        {
          id: "fi_r2",
          question: "Mitä Maija ostaa tänään erikseen?",
          options: ["Maitoa", "Leipää", "Appelsiineja", "Vihanneksia"],
          correct: 2
        },
        {
          id: "fi_r3",
          question: "Miten Maija maksaa?",
          options: ["Käteisellä", "Kortilla", "Puhelimella", "Laskulla"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "Bussiasemalla",
      script: `Mies: Anteeksi, milloin seuraava bussi lähtee Tampereelle?
Nainen: Seuraava bussi lähtee kello 14:30.
Mies: Kuinka kauan matka kestää?
Nainen: Noin kaksi tuntia.
Mies: Kiitos paljon!
Nainen: Ole hyvä!`,
      questions: [
        {
          id: "fi_l1",
          question: "Mihin kaupunkiin mies haluaa matkustaa?",
          options: ["Helsinkiin", "Turkuun", "Tampereelle", "Ouluun"],
          correct: 2
        },
        {
          id: "fi_l2",
          question: "Milloin bussi lähtee?",
          options: ["Kello 12:30", "Kello 13:00", "Kello 14:30", "Kello 15:00"],
          correct: 2
        },
        {
          id: "fi_l3",
          question: "Kuinka kauan matka kestää?",
          options: ["Tunti", "Puolitoista tuntia", "Kaksi tuntia", "Kolme tuntia"],
          correct: 2
        }
      ]
    },
    speaking: {
      prompt: "Kerro lyhyesti, miten menet töihin tai kouluun. Käytät autoa, bussia vai pyörää? Miksi?"
    },
    writing: {
      prompt: "Kirjoita lyhyt viesti ystävällesi. Kutsu hänet kahville ensi viikonloppuna. Kerro missä ja milloin tapaatte. (Noin 50 sanaa)"
    }
  },
  swedish: {
    reading: {
      title: "På biblioteket",
      text: `Anna arbetar på biblioteket i centrum. Varje dag hjälper hon besökare att hitta böcker och tidningar.
Idag kommer en ung man och frågar om böcker på svenska för nybörjare.
Anna rekommenderar tre böcker och visar honom hur han kan låna dem med sitt bibliotekskort.
Mannen är nöjd och tackar Anna för hjälpen.`,
      questions: [
        {
          id: "sv_r1",
          question: "Var arbetar Anna?",
          options: ["På en skola", "På ett bibliotek", "På ett café", "På ett kontor"],
          correct: 1
        },
        {
          id: "sv_r2",
          question: "Vad frågar mannen efter?",
          options: ["Tidningar", "Datorhjälp", "Böcker på svenska för nybörjare", "Öppettider"],
          correct: 2
        },
        {
          id: "sv_r3",
          question: "Hur kan mannen låna böckerna?",
          options: ["Med kontanter", "Med ett bibliotekskort", "Med ett ID-kort", "Gratis"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "I affären",
      script: `Kassörska: Hej! Hittade du allt du sökte?
Kund: Ja tack. Jag har lite frågor om era erbjudanden.
Kassörska: Självklart! Vad undrar du?
Kund: Är mjölken på rea idag?
Kassörska: Ja, all mjölk är 20% billigare idag.
Kund: Utmärkt! Då tar jag två liter.`,
      questions: [
        {
          id: "sv_l1",
          question: "Vad frågar kunden om?",
          options: ["Öppettider", "Erbjudanden", "Parkering", "Kundservice"],
          correct: 1
        },
        {
          id: "sv_l2",
          question: "Hur mycket rabatt är det på mjölken?",
          options: ["10%", "15%", "20%", "25%"],
          correct: 2
        },
        {
          id: "sv_l3",
          question: "Hur mycket mjölk köper kunden?",
          options: ["En liter", "Två liter", "Tre liter", "En halvliter"],
          correct: 1
        }
      ]
    },
    speaking: {
      prompt: "Berätta kort om din dag igår. Vad gjorde du på morgonen, eftermiddagen och kvällen?"
    },
    writing: {
      prompt: "Skriv ett kort meddelande till din granne. Du vill bjuda in honom/henne på middag nästa helg. Skriv var och när. (Ca 50 ord)"
    }
  },
  danish: {
    reading: {
      title: "En dag i København",
      text: `Thomas bor i en lille lejlighed i København. Han arbejder på et hospital som sygeplejerske.
Hver morgen cykler han til arbejde – det tager kun 15 minutter.
Han elsker sin by og bruger weekenderne på at udforske nye cafeer og parker.
Særligt Nørreport-kvarteret er hans yndlingssted, fordi der altid er liv og musik.`,
      questions: [
        {
          id: "da_r1",
          question: "Hvad arbejder Thomas som?",
          options: ["Læge", "Sygeplejerske", "Tandlæge", "Apoteker"],
          correct: 1
        },
        {
          id: "da_r2",
          question: "Hvordan kommer Thomas på arbejde?",
          options: ["Med bus", "Med tog", "Med cykel", "Til fods"],
          correct: 2
        },
        {
          id: "da_r3",
          question: "Hvad kan man finde i Nørreport-kvarteret?",
          options: ["Ro og stilhed", "Liv og musik", "Stor park", "Mange butikker"],
          correct: 1
        }
      ]
    },
    listening: {
      title: "På restauranten",
      script: `Tjener: Goddag! Er I klar til at bestille?
Gæst: Ja tak. Hvad anbefaler du?
Tjener: Vores smørrebrød er meget populært i dag.
Gæst: Det lyder godt. Jeg tager to stykker smørrebrød og en kop kaffe.
Tjener: Skal det være med mælk?
Gæst: Ja tak, gerne med lidt mælk.`,
      questions: [
        {
          id: "da_l1",
          question: "Hvad anbefaler tjeneren?",
          options: ["Suppe", "Smørrebrød", "Pizza", "Salat"],
          correct: 1
        },
        {
          id: "da_l2",
          question: "Hvad bestiller gæsten at drikke?",
          options: ["Te", "Juice", "Kaffe", "Vand"],
          correct: 2
        },
        {
          id: "da_l3",
          question: "Hvad vil gæsten have i sin kaffe?",
          options: ["Sukker", "Ingenting", "Mælk", "Fløde"],
          correct: 2
        }
      ]
    },
    speaking: {
      prompt: "Fortæl kort om din by eller dit nabolag. Hvad kan man gøre der? Hvad kan du lide bedst?"
    },
    writing: {
      prompt: "Skriv en kort besked til din ven. Du vil mødes i weekenden. Fortæl hvornår og hvor. (Ca. 50 ord)"
    }
  }
};

export const LANGUAGE_LABELS = {
  finnish: { name: "Finnish", flag: "🇫🇮", exam: "YKI" },
  swedish: { name: "Swedish", flag: "🇸🇪", exam: "Swedex" },
  danish: { name: "Danish", flag: "🇩🇰", exam: "PD3" }
};

export const CEFR_ESTIMATE = {
  high: { label: "B1–B2", message: "You have a strong foundation. Sign up to prepare for the full exam!" },
  mid: { label: "A2–B1", message: "Good progress! Regular practice will get you exam-ready." },
  low: { label: "A1–A2", message: "Great start! Keep practicing and you'll improve quickly." }
};
