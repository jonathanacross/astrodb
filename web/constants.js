export const objectTypes = [
  // "fixedPosition" indicates if this type of object is expected to have a
  // RA/Dec/constellation.
  { shortName: 'Ast', fullName: 'Asterism', fixedPosition: true },
  { shortName: 'Asteroid', fullName: 'Asteroid', fixedPosition: false },
  { shortName: 'Aurora', fullName: 'Aurora', fixedPosition: false },
  { shortName: 'Carbon', fullName: 'Carbon Star', fixedPosition: true },
  { shortName: 'Comet', fullName: 'Comet', fixedPosition: false },
  { shortName: 'Con', fullName: 'Constellation', fixedPosition: true },
  { shortName: 'DN', fullName: 'Dark Nebula', fixedPosition: true },
  { shortName: 'Double', fullName: 'Double/Multiple Star', fixedPosition: true },
  { shortName: 'EN', fullName: 'Emission Nebula', fixedPosition: true },
  { shortName: 'Gal', fullName: 'Galaxy', fixedPosition: true },
  { shortName: 'GCl', fullName: 'Globular Cluster', fixedPosition: true },
  { shortName: 'Moon', fullName: 'Moon / Lunar feature', fixedPosition: false },
  { shortName: 'Nova', fullName: 'Nova', fixedPosition: true },
  { shortName: 'OCl', fullName: 'Open Cluster', fixedPosition: true },
  { shortName: 'Planet', fullName: 'Planet', fixedPosition: false },
  { shortName: 'PN', fullName: 'Planetary Nebula', fixedPosition: true },
  { shortName: 'Q', fullName: 'Quasar', fixedPosition: true },
  { shortName: 'RN', fullName: 'Reflection Nebula', fixedPosition: true },
  { shortName: 'Star', fullName: 'Star', fixedPosition: true },
  { shortName: 'Star Cloud', fullName: 'Star Cloud', fixedPosition: true },
  { shortName: 'Sun', fullName: 'Sun', fixedPosition: false },
  { shortName: 'Supernova', fullName: 'Supernova', fixedPosition: true },
  { shortName: 'SNR', fullName: 'Supernova Remnant', fixedPosition: true },
  { shortName: 'Variable', fullName: 'Variable Star', fixedPosition: true }
];

export const constellations = [
  // RA is the average of the most eastward and most westward RA.
  // Dec is the average of the most northern and most southern declination.
  // Adapted from https://en.wikipedia.org/wiki/IAU_designated_constellations_by_area
  { abbreviation: 'And', ra: 0.81, dec: 37.4, fullName: 'Andromeda' },
  { abbreviation: 'Ant', ra: 10.27, dec: -32.5, fullName: 'Antlia' },
  { abbreviation: 'Aps', ra: 16.14, dec: -75.3, fullName: 'Apus' },
  { abbreviation: 'Aql', ra: 19.67, dec: 3.4, fullName: 'Aquila' },
  { abbreviation: 'Aqr', ra: 22.29, dec: -10.8, fullName: 'Aquarius' },
  { abbreviation: 'Ara', ra: 17.37, dec: -56.6, fullName: 'Ara' },
  { abbreviation: 'Ari', ra: 2.64, dec: 20.8, fullName: 'Aries' },
  { abbreviation: 'Aur', ra: 6.07, dec: 42.0, fullName: 'Auriga' },
  { abbreviation: 'Boo', ra: 14.71, dec: 31.2, fullName: 'Bootes' },
  { abbreviation: 'Cae', ra: 4.70, dec: -37.9, fullName: 'Caelum' },
  { abbreviation: 'Cam', ra: 8.86, dec: 69.4, fullName: 'Camelopardalis' },
  { abbreviation: 'Cap', ra: 21.05, dec: -18.0, fullName: 'Capricornus' },
  { abbreviation: 'Car', ra: 8.70, dec: -63.2, fullName: 'Carina' },
  { abbreviation: 'Cas', ra: 1.32, dec: 62.2, fullName: 'Cassiopeia' },
  { abbreviation: 'Cen', ra: 13.07, dec: -47.3, fullName: 'Centaurus' },
  { abbreviation: 'Cep', ra: 2.54, dec: 71.0, fullName: 'Cepheus' },
  { abbreviation: 'Cet', ra: 1.67, dec: -7.2, fullName: 'Cetus' },
  { abbreviation: 'Cha', ra: 10.69, dec: -79.2, fullName: 'Chamaeleon' },
  { abbreviation: 'Cir', ra: 14.58, dec: -63.0, fullName: 'Circinus' },
  { abbreviation: 'CMa', ra: 6.83, dec: -22.1, fullName: 'Canis Major' },
  { abbreviation: 'CMi', ra: 7.65, dec: 6.4, fullName: 'Canis Minor' },
  { abbreviation: 'Cnc', ra: 8.65, dec: 19.8, fullName: 'Cancer' },
  { abbreviation: 'Col', ra: 5.86, dec: -35.1, fullName: 'Columba' },
  { abbreviation: 'Com', ra: 12.79, dec: 23.3, fullName: 'Coma Berenices' },
  { abbreviation: 'CrA', ra: 18.65, dec: -41.1, fullName: 'Corona Australis' },
  { abbreviation: 'CrB', ra: 15.84, dec: 32.6, fullName: 'Corona Borealis' },
  { abbreviation: 'Crt', ra: 11.40, dec: -15.9, fullName: 'Crater' },
  { abbreviation: 'Cru', ra: 12.45, dec: -60.2, fullName: 'Crux' },
  { abbreviation: 'Crv', ra: 12.44, dec: -18.4, fullName: 'Corvus' },
  { abbreviation: 'CVn', ra: 13.12, dec: 40.1, fullName: 'Canes Venatici' },
  { abbreviation: 'Cyg', ra: 20.59, dec: 44.5, fullName: 'Cygnus' },
  { abbreviation: 'Del', ra: 20.69, dec: 11.7, fullName: 'Delphinus' },
  { abbreviation: 'Dor', ra: 5.24, dec: -59.4, fullName: 'Dorado' },
  { abbreviation: 'Dra', ra: 15.14, dec: 67.0, fullName: 'Draco' },
  { abbreviation: 'Equ', ra: 21.19, dec: 7.8, fullName: 'Equuleus' },
  { abbreviation: 'Eri', ra: 3.30, dec: -28.8, fullName: 'Eridanus' },
  { abbreviation: 'For', ra: 2.80, dec: -31.6, fullName: 'Fornax' },
  { abbreviation: 'Gem', ra: 7.07, dec: 22.6, fullName: 'Gemini' },
  { abbreviation: 'Gru', ra: 22.46, dec: -46.4, fullName: 'Grus' },
  { abbreviation: 'Her', ra: 17.39, dec: 27.5, fullName: 'Hercules' },
  { abbreviation: 'Hor', ra: 3.28, dec: -53.3, fullName: 'Horologium' },
  { abbreviation: 'Hya', ra: 11.61, dec: -14.5, fullName: 'Hydra' },
  { abbreviation: 'Hyi', ra: 2.34, dec: -70.0, fullName: 'Hydrus' },
  { abbreviation: 'Ind', ra: 21.97, dec: -59.7, fullName: 'Indus' },
  { abbreviation: 'Lac', ra: 22.46, dec: 46.0, fullName: 'Lacerta' },
  { abbreviation: 'Leo', ra: 10.67, dec: 13.1, fullName: 'Leo' },
  { abbreviation: 'Lep', ra: 5.57, dec: -19.0, fullName: 'Lepus' },
  { abbreviation: 'Lib', ra: 15.20, dec: -15.2, fullName: 'Libra' },
  { abbreviation: 'LMi', ra: 10.25, dec: 32.1, fullName: 'Leo Minor' },
  { abbreviation: 'Lup', ra: 15.22, dec: -42.7, fullName: 'Lupus' },
  { abbreviation: 'Lyn', ra: 7.99, dec: 47.5, fullName: 'Lynx' },
  { abbreviation: 'Lyr', ra: 18.85, dec: 36.7, fullName: 'Lyra' },
  { abbreviation: 'Men', ra: 5.42, dec: -77.5, fullName: 'Mensa' },
  { abbreviation: 'Mic', ra: 20.96, dec: -36.3, fullName: 'Microscopium' },
  { abbreviation: 'Mon', ra: 7.06, dec: 0.3, fullName: 'Monoceros' },
  { abbreviation: 'Mus', ra: 12.59, dec: -70.2, fullName: 'Musca' },
  { abbreviation: 'Nor', ra: 15.90, dec: -51.4, fullName: 'Norma' },
  { abbreviation: 'Oct', ra: 23.00, dec: -82.2, fullName: 'Octans' },
  { abbreviation: 'Oph', ra: 17.39, dec: -7.9, fullName: 'Ophiuchus' },
  { abbreviation: 'Ori', ra: 5.58, dec: 5.9, fullName: 'Orion' },
  { abbreviation: 'Pav', ra: 19.61, dec: -65.8, fullName: 'Pavo' },
  { abbreviation: 'Peg', ra: 22.70, dec: 19.5, fullName: 'Pegasus' },
  { abbreviation: 'Per', ra: 3.18, dec: 45.0, fullName: 'Perseus' },
  { abbreviation: 'Phe', ra: 0.93, dec: -48.6, fullName: 'Phoenix' },
  { abbreviation: 'Pic', ra: 5.71, dec: -53.5, fullName: 'Pictor' },
  { abbreviation: 'PsA', ra: 22.28, dec: -30.6, fullName: 'Piscis Austrinus' },
  { abbreviation: 'Psc', ra: 0.48, dec: 13.7, fullName: 'Pisces' },
  { abbreviation: 'Pup', ra: 7.26, dec: -31.2, fullName: 'Puppis' },
  { abbreviation: 'Pyx', ra: 8.95, dec: -27.4, fullName: 'Pyxis' },
  { abbreviation: 'Ret', ra: 3.92, dec: -60.0, fullName: 'Reticulum' },
  { abbreviation: 'Scl', ra: 0.44, dec: -32.1, fullName: 'Sculptor' },
  { abbreviation: 'Sco', ra: 16.89, dec: -27.0, fullName: 'Scorpius' },
  { abbreviation: 'Sct', ra: 18.67, dec: -9.9, fullName: 'Scutum' },
  { abbreviation: 'Ser', ra: 16.95, dec: 6.1, fullName: 'Serpens' },
  { abbreviation: 'Sex', ra: 10.27, dec: -2.6, fullName: 'Sextans' },
  { abbreviation: 'Sge', ra: 19.65, dec: 18.9, fullName: 'Sagitta' },
  { abbreviation: 'Sgr', ra: 19.10, dec: -28.5, fullName: 'Sagittarius' },
  { abbreviation: 'Tau', ra: 4.70, dec: 14.9, fullName: 'Taurus' },
  { abbreviation: 'Tel', ra: 19.33, dec: -51.0, fullName: 'Telescopium' },
  { abbreviation: 'TrA', ra: 16.08, dec: -65.4, fullName: 'Triangulum Australe' },
  { abbreviation: 'Tri', ra: 2.18, dec: 31.5, fullName: 'Triangulum' },
  { abbreviation: 'Tuc', ra: 23.78, dec: -65.8, fullName: 'Tucana' },
  { abbreviation: 'UMa', ra: 11.31, dec: 50.7, fullName: 'Ursa Major' },
  { abbreviation: 'UMi', ra: 15.00, dec: 77.7, fullName: 'Ursa Minor' },
  { abbreviation: 'Vel', ra: 9.58, dec: -47.2, fullName: 'Vela' },
  { abbreviation: 'Vir', ra: 13.41, dec: -4.2, fullName: 'Virgo' },
  { abbreviation: 'Vol', ra: 7.80, dec: -69.8, fullName: 'Volans' },
  { abbreviation: 'Vul', ra: 20.23, dec: 24.4, fullName: 'Vulpecula' },
  { abbreviation: '', ra: 99.99, dec: 100.0, fullName: 'None' }
];
