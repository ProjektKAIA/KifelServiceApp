import {
  haversineDistance,
  validateClockInLocation,
  calculateTotalDistance,
  formatDistance,
  getRouteBounds,
} from '../locationUtils';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(52.52, 13.405, 52.52, 13.405)).toBe(0);
  });

  it('calculates distance Berlin -> Munich (~504 km)', () => {
    const distance = haversineDistance(52.52, 13.405, 48.1351, 11.582);
    expect(distance).toBeGreaterThan(500000);
    expect(distance).toBeLessThan(510000);
  });

  it('calculates short distance (~100m)', () => {
    // ~100m apart at equator
    const distance = haversineDistance(0, 0, 0, 0.0009);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });
});

describe('validateClockInLocation', () => {
  const officeLat = 52.52;
  const officeLon = 13.405;

  it('returns valid when within threshold', () => {
    const result = validateClockInLocation(52.5201, 13.4051, officeLat, officeLon, 200);
    expect(result.isValid).toBe(true);
    expect(result.distanceMeters).toBeLessThan(200);
  });

  it('returns invalid when outside threshold', () => {
    // ~1km away
    const result = validateClockInLocation(52.53, 13.405, officeLat, officeLon, 200);
    expect(result.isValid).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(200);
  });

  it('returns valid at exact location', () => {
    const result = validateClockInLocation(officeLat, officeLon, officeLat, officeLon, 200);
    expect(result.isValid).toBe(true);
    expect(result.distanceMeters).toBe(0);
  });
});

describe('calculateTotalDistance', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTotalDistance([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(calculateTotalDistance([{ latitude: 52.52, longitude: 13.405, timestamp: 0 }])).toBe(0);
  });

  it('calculates total distance for a route', () => {
    const points = [
      { latitude: 52.52, longitude: 13.405, timestamp: 0 },
      { latitude: 52.521, longitude: 13.405, timestamp: 1000 },
      { latitude: 52.522, longitude: 13.405, timestamp: 2000 },
    ];
    const distance = calculateTotalDistance(points);
    // ~111m per 0.001 degree latitude
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(250);
  });
});

describe('formatDistance', () => {
  it('formats meters', () => {
    expect(formatDistance(150)).toBe('150 m');
  });

  it('formats kilometers', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('formats 0 meters', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('formats exactly 1000m as km', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
  });
});

describe('getRouteBounds', () => {
  it('returns default for empty points', () => {
    const bounds = getRouteBounds([]);
    expect(bounds.latitude).toBe(51.1657);
    expect(bounds.longitude).toBe(10.4515);
  });

  it('calculates center for multiple points', () => {
    const bounds = getRouteBounds([
      { latitude: 52, longitude: 13, timestamp: 0 },
      { latitude: 54, longitude: 15, timestamp: 1000 },
    ]);
    expect(bounds.latitude).toBe(53);
    expect(bounds.longitude).toBe(14);
    expect(bounds.latitudeDelta).toBeGreaterThan(0);
    expect(bounds.longitudeDelta).toBeGreaterThan(0);
  });

  it('handles single point with minimum delta', () => {
    const bounds = getRouteBounds([
      { latitude: 52, longitude: 13, timestamp: 0 },
    ]);
    expect(bounds.latitude).toBe(52);
    expect(bounds.longitude).toBe(13);
    expect(bounds.latitudeDelta).toBe(0.005);
    expect(bounds.longitudeDelta).toBe(0.005);
  });
});
