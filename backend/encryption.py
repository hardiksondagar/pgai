from cryptography.fernet import Fernet
import os
import base64
from pathlib import Path

class Encryption:
    def __init__(self):
        self.key_file = Path.home() / '.pgai' / 'encryption.key'
        self.key_file.parent.mkdir(exist_ok=True)
        self.cipher = self._get_or_create_cipher()

    def _get_or_create_cipher(self):
        if self.key_file.exists():
            with open(self.key_file, 'rb') as f:
                key = f.read()
        else:
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            os.chmod(self.key_file, 0o600)

        return Fernet(key)

    def encrypt(self, data: str) -> str:
        """Encrypt a string and return base64 encoded result"""
        if not data:
            return ""
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a base64 encoded encrypted string"""
        if not encrypted_data:
            return ""
        try:
            decoded = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""

# Global instance
encryption = Encryption()

