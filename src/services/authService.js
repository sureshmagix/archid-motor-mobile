import {AUTH_CONFIG} from '../constants/authConfig';

export const loginWithHardcodedCredentials = (username, password) => {
  const isValid =
    String(username).trim() === AUTH_CONFIG.defaultUsername &&
    String(password).trim() === AUTH_CONFIG.defaultPassword;

  if (!isValid) {
    return {ok: false, message: 'Invalid username or password'};
  }

  return {
    ok: true,
    user: {
      username: AUTH_CONFIG.defaultUsername,
      name: 'ArchidTech Admin',
      role: 'admin',
    },
  };
};
