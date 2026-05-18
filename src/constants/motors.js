export const DEFAULT_PARAMETERS = {
  voltage: '-- V',
  current: '-- A',
  rpm: '-- RPM',
  temperature: '-- °C',
  runStatus: 'Unknown',
  faultStatus: 'No data',
};

export const INITIAL_MOTORS = Array.from({length: 6}, (_, index) => ({
  id: `motor-${index + 1}`,
  name: `Motor ${index + 1}`,
  status: 'OFF',
  lastMessage: 'Waiting for confirmation',
  updatedAt: null,
  parameters: {...DEFAULT_PARAMETERS},
}));
