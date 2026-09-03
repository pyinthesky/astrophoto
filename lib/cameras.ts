export type CameraProfile = {
  id: string;
  brand: string;
  model: string;
  year: number;
  sensorWidth: number;
  sensorHeight: number;
  imageWidth: number;
  imageHeight: number;
  current?: boolean;
};

export const cameras: CameraProfile[] = [
  { id: "sony-a7r-vi", brand: "Sony", model: "α7R VI", year: 2026, sensorWidth: 35.9, sensorHeight: 24.0, imageWidth: 9984, imageHeight: 6656, current: true },
  { id: "sony-a1-ii", brand: "Sony", model: "α1 II", year: 2024, sensorWidth: 35.9, sensorHeight: 24.0, imageWidth: 8640, imageHeight: 5760, current: true },
  { id: "sony-a7r-v", brand: "Sony", model: "α7R V", year: 2022, sensorWidth: 35.7, sensorHeight: 23.8, imageWidth: 9504, imageHeight: 6336 },
  { id: "sony-a7-iv", brand: "Sony", model: "α7 IV", year: 2021, sensorWidth: 35.9, sensorHeight: 23.9, imageWidth: 7008, imageHeight: 4672 },
  { id: "sony-a7s-iii", brand: "Sony", model: "α7S III", year: 2020, sensorWidth: 35.6, sensorHeight: 23.8, imageWidth: 4240, imageHeight: 2832 },
  { id: "sony-a6700", brand: "Sony", model: "α6700", year: 2023, sensorWidth: 23.3, sensorHeight: 15.5, imageWidth: 6192, imageHeight: 4128 },

  { id: "canon-r6-iii", brand: "Canon", model: "EOS R6 Mark III", year: 2025, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 6960, imageHeight: 4640, current: true },
  { id: "canon-r5-ii", brand: "Canon", model: "EOS R5 Mark II", year: 2024, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 8192, imageHeight: 5464, current: true },
  { id: "canon-r1", brand: "Canon", model: "EOS R1", year: 2024, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 6000, imageHeight: 4000, current: true },
  { id: "canon-r8", brand: "Canon", model: "EOS R8", year: 2023, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 6000, imageHeight: 4000 },
  { id: "canon-r7", brand: "Canon", model: "EOS R7", year: 2022, sensorWidth: 22.3, sensorHeight: 14.8, imageWidth: 6960, imageHeight: 4640 },

  { id: "nikon-z8", brand: "Nikon", model: "Z8", year: 2023, sensorWidth: 35.9, sensorHeight: 23.9, imageWidth: 8256, imageHeight: 5504, current: true },
  { id: "nikon-z9", brand: "Nikon", model: "Z9", year: 2021, sensorWidth: 35.9, sensorHeight: 23.9, imageWidth: 8256, imageHeight: 5504 },
  { id: "nikon-z6-iii", brand: "Nikon", model: "Z6III", year: 2024, sensorWidth: 35.9, sensorHeight: 23.9, imageWidth: 6048, imageHeight: 4032, current: true },
  { id: "nikon-zf", brand: "Nikon", model: "Z f", year: 2023, sensorWidth: 35.9, sensorHeight: 23.9, imageWidth: 6048, imageHeight: 4032 },

  { id: "fuji-xe5", brand: "Fujifilm", model: "X-E5", year: 2025, sensorWidth: 23.5, sensorHeight: 15.7, imageWidth: 7728, imageHeight: 5152, current: true },
  { id: "fuji-xt5", brand: "Fujifilm", model: "X-T5", year: 2022, sensorWidth: 23.5, sensorHeight: 15.7, imageWidth: 7728, imageHeight: 5152 },
  { id: "fuji-xh2s", brand: "Fujifilm", model: "X-H2S", year: 2022, sensorWidth: 23.5, sensorHeight: 15.6, imageWidth: 6240, imageHeight: 4160 },
  { id: "fuji-gfx100sii", brand: "Fujifilm", model: "GFX100S II", year: 2024, sensorWidth: 43.8, sensorHeight: 32.9, imageWidth: 11648, imageHeight: 8736, current: true },

  { id: "panasonic-s1rii", brand: "Panasonic", model: "LUMIX S1RII", year: 2025, sensorWidth: 35.9, sensorHeight: 24.0, imageWidth: 8144, imageHeight: 5424, current: true },
  { id: "panasonic-s1ii", brand: "Panasonic", model: "LUMIX S1II", year: 2025, sensorWidth: 35.6, sensorHeight: 23.8, imageWidth: 6000, imageHeight: 4000, current: true },
  { id: "panasonic-s5ii", brand: "Panasonic", model: "LUMIX S5II", year: 2023, sensorWidth: 35.6, sensorHeight: 23.8, imageWidth: 6000, imageHeight: 4000 },

  { id: "om-om3", brand: "OM System", model: "OM-3", year: 2025, sensorWidth: 17.4, sensorHeight: 13.0, imageWidth: 5184, imageHeight: 3888, current: true },
  { id: "om-om1ii", brand: "OM System", model: "OM-1 Mark II", year: 2024, sensorWidth: 17.4, sensorHeight: 13.0, imageWidth: 5184, imageHeight: 3888 },

  { id: "leica-sl3p", brand: "Leica", model: "SL3-P", year: 2025, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 8144, imageHeight: 5424, current: true },
  { id: "leica-sl3", brand: "Leica", model: "SL3", year: 2024, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 9520, imageHeight: 6336 },
  { id: "leica-q3-43", brand: "Leica", model: "Q3 43", year: 2024, sensorWidth: 36.0, sensorHeight: 24.0, imageWidth: 9520, imageHeight: 6336 },

  { id: "hasselblad-x2d", brand: "Hasselblad", model: "X2D 100C", year: 2022, sensorWidth: 43.8, sensorHeight: 32.9, imageWidth: 11656, imageHeight: 8742 },
  { id: "pentax-k3iii", brand: "Pentax", model: "K-3 Mark III", year: 2021, sensorWidth: 23.3, sensorHeight: 15.5, imageWidth: 6192, imageHeight: 4128 },
];

export const brands = [...new Set(cameras.map((camera) => camera.brand))];

