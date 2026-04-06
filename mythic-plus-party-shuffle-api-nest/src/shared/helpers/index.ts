import * as crypto from 'crypto'; // ← Changer l'import

const SECRET = 'GMC-REST-API';

export const random = () => crypto.randomBytes(128).toString('base64');

export const authentication = (salt: string, password: string) => {
  return crypto.createHmac('sha256', [salt, password].join('/')).update(SECRET).digest('hex');
};