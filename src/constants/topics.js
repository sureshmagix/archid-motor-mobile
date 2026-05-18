export const TOPICS = {
  legacyMotorStatus: 'archidtech/motor/status',
  motorStatusWildcard: 'archidtech/motor/+/status',
  motorConfirmationWildcard: 'archidtech/motor/+/confirmation',
  motorTelemetryWildcard: 'archidtech/motor/+/telemetry',
  motorCommand: motorId => `archidtech/motor/${motorId}/command`,
  motorStatus: motorId => `archidtech/motor/${motorId}/status`,
  motorConfirmation: motorId => `archidtech/motor/${motorId}/confirmation`,
  motorTelemetry: motorId => `archidtech/motor/${motorId}/telemetry`,
};
