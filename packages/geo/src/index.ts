export interface LngLat {
  lng: number;
  lat: number;
}

export const normalizeLongitude = (value: number): number => {
  if (value >= -180 && value <= 180) {
    return value;
  }

  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 ? 180 : wrapped;
};

export const isValidCoordinate = ({ lng, lat }: LngLat): boolean => {
  return Number.isFinite(lng) && Number.isFinite(lat) && lat >= -90 && lat <= 90;
};

export const toGeoPoint = ({ lng, lat }: LngLat): string => {
  if (!isValidCoordinate({ lng, lat })) {
    throw new Error("Invalid coordinate");
  }

  return `POINT(${normalizeLongitude(lng)} ${lat})`;
};
