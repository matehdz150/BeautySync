import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../core/ports/password-hasher.port';

export class BcryptPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
