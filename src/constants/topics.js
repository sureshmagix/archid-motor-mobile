export const TOPICS = {
  legacyMotorStatus: 'archidtech/motor/status',

  motorStatusWildcard: 'archidtech/motor/+/status',
  motorConfirmationWildcard: 'archidtech/motor/+/confirmation',
  motorTelemetryWildcard: 'archidtech/motor/+/telemetry',

  motorCommand: motorId => `archidtech/motor/${motorId}/command`,
  motorStatus: motorId => `archidtech/motor/${motorId}/status`,
  motorConfirmation: motorId => `archidtech/motor/${motorId}/confirmation`,
  motorTelemetry: motorId => `archidtech/motor/${motorId}/telemetry`,

  wifiProvisioning: deviceId => `archidtech/device/${deviceId}/wifi/provision`,

  mobileHomeVisit: 'archidtech/mobile/home/visit',

  screenActivity: screenName =>
    `archidtech/mobile/screen/${screenName}/activity`,

  screenActivityAll: 'archidtech/mobile/screen/+/activity',
};