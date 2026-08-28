import crypto from 'crypto'

export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashPin(pin: string, salt: string): string {
  return crypto
    .createHmac('sha256', salt)
    .update(pin)
    .digest('hex')
}

export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (!pin) return { valid: false, error: 'PIN is required' }
  if (pin.length !== 6) return { valid: false, error: 'PIN must be exactly 6 digits' }
  if (!/^\d{6}$/.test(pin)) return { valid: false, error: 'PIN must contain only numbers' }
  
  // Reject weak patterns
  if (/^(\d)\1{5}$/.test(pin)) return { valid: false, error: 'PIN cannot be all same digits' }
  if (['123456', '654321', '000000', '111111', '123123', '456789'].includes(pin)) {
    return { valid: false, error: 'PIN is too common' }
  }
  
  return { valid: true }
}