export const PH_VOLCANOES = [
  {
    id: 'vol-mayon',
    name: 'Mayon Volcano',
    province: 'Albay, Bicol Region',
    alertLevel: 2,
    status: 'Alert Level 2 (Moderate Unrest)',
    type: 'Stratovolcano',
    elevation: '2,463 m',
    activity: 'Low-level unrest, degassing, and faint crater glow. 6km Permanent Danger Zone (PDZ) enforced.',
    lastEruption: '2023-2024',
    lat: 13.2570,
    lng: 123.6850,
  },
  {
    id: 'vol-taal',
    name: 'Taal Volcano',
    province: 'Batangas, Calabarzon',
    alertLevel: 1,
    status: 'Alert Level 1 (Low-level Unrest)',
    type: 'Complex Volcano / Caldera',
    elevation: '311 m',
    activity: 'Volcanic gas emission (SO2), minor degassing, and low-frequency earthquakes. Taal Volcano Island off-limits.',
    lastEruption: '2022',
    lat: 14.0020,
    lng: 120.9930,
  },
  {
    id: 'vol-kanlaon',
    name: 'Kanlaon Volcano',
    province: 'Negros Occidental / Negros Oriental',
    alertLevel: 2,
    status: 'Alert Level 2 (Moderate Unrest)',
    type: 'Stratovolcano',
    elevation: '2,465 m',
    activity: 'Elevated volcanic earthquakes, phreatic explosions, and steam plumes. 4km PDZ strictly enforced.',
    lastEruption: 'June 2024',
    lat: 10.4120,
    lng: 123.1320,
  },
  {
    id: 'vol-bulusan',
    name: 'Bulusan Volcano',
    province: 'Sorsogon, Bicol Region',
    alertLevel: 1,
    status: 'Alert Level 1 (Low-level Unrest)',
    type: 'Stratovolcano',
    elevation: '1,565 m',
    activity: 'Hydrothermal activity, minor seismic tremors, and weak steam emission. 4km PDZ enforced.',
    lastEruption: '2022',
    lat: 12.7700,
    lng: 124.0500,
  },
  {
    id: 'vol-pinatubo',
    name: 'Mount Pinatubo',
    province: 'Zambales / Tarlac / Pampanga',
    alertLevel: 0,
    status: 'Alert Level 0 (Normal)',
    type: 'Stratovolcano / Caldera',
    elevation: '1,486 m',
    activity: 'No significant volcanic activity detected. Background seismic levels.',
    lastEruption: '1991',
    lat: 15.1430,
    lng: 120.3500,
  },
  {
    id: 'vol-hibokhibok',
    name: 'Hibok-Hibok Volcano',
    province: 'Camiguin Island',
    alertLevel: 0,
    status: 'Alert Level 0 (Normal)',
    type: 'Stratovolcano / Lava Dome',
    elevation: '1,332 m',
    activity: 'Quiet background status. Geothermal hot springs monitored.',
    lastEruption: '1953',
    lat: 9.2040,
    lng: 124.6740,
  },
  {
    id: 'vol-matutum',
    name: 'Mount Matutum',
    province: 'South Cotabato, Mindanao',
    alertLevel: 0,
    status: 'Alert Level 0 (Normal)',
    type: 'Stratovolcano',
    elevation: '2,286 m',
    activity: 'No volcanic unrest. Seismicity within normal baseline.',
    lastEruption: '1911',
    lat: 6.3600,
    lng: 125.0780,
  },
  {
    id: 'vol-parker',
    name: 'Mount Parker (Melibengoy)',
    province: 'South Cotabato, Mindanao',
    alertLevel: 0,
    status: 'Alert Level 0 (Normal)',
    type: 'Stratovolcano / Crater Lake',
    elevation: '1,824 m',
    activity: 'Normal baseline activity. Crater lake water chemistry monitored.',
    lastEruption: '1641',
    lat: 6.1110,
    lng: 124.8920,
  },
  {
    id: 'vol-biliran',
    name: 'Biliran Volcano',
    province: 'Biliran Province, Visayas',
    alertLevel: 0,
    status: 'Alert Level 0 (Normal)',
    type: 'Fissure Vent / Lava Domes',
    elevation: '1,340 m',
    activity: 'Hydrothermal thermal fields active (fumaroles), no magmatic unrest.',
    lastEruption: '1939',
    lat: 11.5260,
    lng: 124.5360,
  },
  {
    id: 'vol-apo',
    name: 'Mount Apo',
    province: 'Davao del Sur / Cotabato',
    alertLevel: 0,
    status: 'Alert Level 0 (Potentially Active)',
    type: 'Stratovolcano',
    elevation: '2,954 m',
    activity: 'Sol Fumarolic degassing near summit. Highest peak in PH.',
    lastEruption: 'Prehistoric',
    lat: 6.9870,
    lng: 125.2710,
  },
]

export function getVolcanoAlertInfo(level) {
  switch (level) {
    case 5:
      return {
        label: 'Level 5 - Hazardous Eruption in Progress',
        color: 'bg-purple-700 text-white border-purple-900',
        badge: 'bg-purple-600 text-white animate-pulse',
        advice: 'Evacuate immediately! Severe pyroclastic flows, ashfall, and lava streams.',
      }
    case 4:
      return {
        label: 'Level 4 - Hazardous Eruption Imminent',
        color: 'bg-red-600 text-white border-red-700',
        badge: 'bg-red-600 text-white animate-pulse',
        advice: 'Hazardous eruption possible within hours or days. mandatory evacuation of Danger Zone.',
      }
    case 3:
      return {
        label: 'Level 3 - High Level of Volcanic Unrest',
        color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
        badge: 'bg-rose-600 text-white',
        advice: 'Magma is at shallow depth. Eruption possible within weeks. Stay alert.',
      }
    case 2:
      return {
        label: 'Level 2 - Moderate Level of Unrest',
        color: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40',
        badge: 'bg-amber-600 text-white',
        advice: 'Magmatic intruding or steam-driven explosions possible. Strictly no entry in Danger Zone.',
      }
    case 1:
      return {
        label: 'Level 1 - Low-Level Unrest',
        color: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/30',
        badge: 'bg-yellow-500 text-slate-900',
        advice: 'Hydrothermal or magmatic activity active. No eruption imminent.',
      }
    default:
      return {
        label: 'Level 0 - Normal',
        color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        badge: 'bg-emerald-600 text-white',
        advice: 'No eruption foreseen. Normal background activity.',
      }
  }
}
