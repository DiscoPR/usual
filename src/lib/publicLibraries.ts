export type PublicLibrary = {
  nick: string;
  city: string;
  title: string;
  note: string;
  searchCity: string;
  lists: Array<{ label: string; url: string }>;
};

export const PUBLIC_LIBRARIES: PublicLibrary[] = [
  {
    nick: "FLLocal",
    city: "Fort Lauderdale",
    title: "Kevin's usuals",
    note: "The demo seed library. Five home spots, not a tourist list.",
    searchCity: "",
    lists: [],
  },
  {
    nick: "SoCoScout",
    city: "Austin",
    title: "Austin public lists",
    note: "Shared Eater and Visit Austin list pages. Search this town to crawl them.",
    searchCity: "Austin, tx",
    lists: [
      {
        label: "Eater Austin 24-hour map",
        url: "https://austin.eater.com/maps/best-24-hour-restaurants-austin-cafes-diners-all-hours-24-7",
      },
      {
        label: "Eater South Congress map",
        url: "https://austin.eater.com/maps/south-congress-austin-best-restaurants-bars-dining-guide-where-to-eat-travis-heights-bouldin-creek",
      },
      {
        label: "Eater Austin dive bars",
        url: "https://austin.eater.com/maps/best-dive-bars-austin",
      },
      {
        label: "Eater Austin coffee map",
        url: "https://austin.eater.com/maps/best-coffee-austin-cafes-espressos-lattes",
      },
      {
        label: "Visit Austin outdoors",
        url: "https://www.austintexas.org/things-to-do/outdoors/",
      },
      {
        label: "Time Out Austin restaurants",
        url: "https://www.timeout.com/austin/restaurants",
      },
      {
        label: "Visit Austin restaurants",
        url: "https://www.austintexas.org/restaurants/",
      },
    ],
  },
  {
    nick: "LisbonDesk",
    city: "Lisbon",
    title: "Lisbon public lists",
    note: "Shared Time Out and Visit Lisboa pages. Search Lisbon to crawl them.",
    searchCity: "Lisbon",
    lists: [
      {
        label: "Time Out Lisbon restaurants",
        url: "https://www.timeout.com/lisbon/restaurants",
      },
      {
        label: "Visit Lisboa",
        url: "https://www.visitlisboa.com/en",
      },
    ],
  },
  {
    nick: "HudsonHost",
    city: "Hoboken",
    title: "Hoboken public lists",
    note: "Shared Hudson and Jersey City list pages. Not the filmed demo city. Search Austin if this town returns no lists.",
    searchCity: "Hoboken, nj",
    lists: [
      {
        label: "Jill Biggs, best restaurants Hoboken",
        url: "https://www.thejillbiggsgroup.com/blog/best-restaurants-hoboken-nj-2025-2026",
      },
      {
        label: "Visit Hudson, Hoboken restaurants",
        url: "https://www.visithudson.org/restaurants/hoboken/",
      },
      {
        label: "Eater, best Jersey City restaurants",
        url: "https://ny.eater.com/maps/best-jersey-city-restaurants",
      },
    ],
  },
];
