// src/constants/topics.js

const DEFAULT_TOPIC_PREFIX = 'guest';

/**
 * Converts login username into a safe MQTT topic prefix.
 *
 * Example:
 * admin       -> admin
 * Super Admin -> super_admin
 * site/user1  -> site_user1
 */
export const getTopicPrefix = username => {
  return String(username || DEFAULT_TOPIC_PREFIX)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
};

export const TOPICS = {
  // ---------------------------------------------------------------------------
  // MOTOR STATUS TOPICS
  // ---------------------------------------------------------------------------

  legacyMotorStatus: username =>
    `${getTopicPrefix(username)}/motor/status`,

  motorStatusWildcard: username =>
    `${getTopicPrefix(username)}/motor/+/status`,

  motorConfirmationWildcard: username =>
    `${getTopicPrefix(username)}/motor/+/confirmation`,

  motorTelemetryWildcard: username =>
    `${getTopicPrefix(username)}/motor/+/telemetry`,

  // ---------------------------------------------------------------------------
  // MOTOR SPECIFIC TOPICS
  // ---------------------------------------------------------------------------

  motorCommand: (username, motorId) =>
    `${getTopicPrefix(username)}/motor/${motorId}/command`,

  motorStatus: (username, motorId) =>
    `${getTopicPrefix(username)}/motor/${motorId}/status`,

  motorConfirmation: (username, motorId) =>
    `${getTopicPrefix(username)}/motor/${motorId}/confirmation`,

  motorTelemetry: (username, motorId) =>
    `${getTopicPrefix(username)}/motor/${motorId}/telemetry`,

  // ---------------------------------------------------------------------------
  // WIFI PROVISIONING
  // ---------------------------------------------------------------------------

  wifiProvisioning: (username, deviceId) =>
    `${getTopicPrefix(username)}/device/${deviceId}/wifi/provision`,

  // ---------------------------------------------------------------------------
  // MOBILE APP ACTIVITY TOPICS
  // ---------------------------------------------------------------------------

  mobileHomeVisit: username =>
    `${getTopicPrefix(username)}/mobile/home/visit`,

  screenActivity: (username, screenName) =>
    `${getTopicPrefix(username)}/mobile/screen/${screenName}/activity`,

  screenActivityAll: username =>
    `${getTopicPrefix(username)}/mobile/screen/+/activity`,
};