export class SteganographyService {
  static textToBinary(text) {
    return text.split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
  }

  static binaryToText(binary) {
    const bytes = binary.match(/.{1,8}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  }

  static createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  static async getImageData(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = this.createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({ imageData: ctx.getImageData(0, 0, img.width, img.height), canvas, ctx });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static processData(data, binaryMessage, isProtected, encode = true) {
    let result = '';
    let binaryIndex = 0;
    
    if (encode) {
      // Store message length at the beginning (32 bits)
      if (binaryMessage) {
        const lengthBinary = binaryMessage.length.toString(2).padStart(32, '0');
        for (let i = 0; i < 32; i++) {
          const byteIndex = Math.floor(i / 3) * 4;
          const colorIndex = i % 3;
          const bit = parseInt(lengthBinary[i]);
          data[byteIndex + colorIndex] = (data[byteIndex + colorIndex] & ~3) | (bit ? 3 : 0);
        }
      }

      // Start storing message after length (offset by 44 bytes to account for length storage)
      const startOffset = 44;
      for (let i = startOffset; i < data.length && binaryIndex < binaryMessage.length; i += 4) {
        for (let j = 0; j < 3 && binaryIndex < binaryMessage.length; j++) {
          const bit = parseInt(binaryMessage[binaryIndex]);
          if (isProtected) {
            data[i + j] = (data[i + j] & ~3) | (bit ? 3 : 0);
          } else {
            data[i + j] = (data[i + j] & ~3) | (bit ? 2 : 0);
          }
          binaryIndex++;
        }
      }
    } else {
      // Read message length first
      let lengthBinary = '';
      for (let i = 0; i < 32; i++) {
        const byteIndex = Math.floor(i / 3) * 4;
        const colorIndex = i % 3;
        lengthBinary += (data[byteIndex + colorIndex] & 3) === 3 ? '1' : '0';
      }
      const messageLength = parseInt(lengthBinary, 2);

      // Read message data
      const startOffset = 44;
      let count = 0;
      for (let i = startOffset; i < data.length && count < messageLength; i += 4) {
        for (let j = 0; j < 3 && count < messageLength; j++) {
          if (isProtected) {
            result += (data[i + j] & 3) === 3 ? '1' : '0';
          } else {
            result += (data[i + j] & 3) >= 2 ? '1' : '0';
          }
          count++;
        }
      }
    }
    
    return encode ? data : result;
  }

  static async verifyProtection(imageFile) {
    try {
      const { imageData } = await this.getImageData(imageFile);
      const data = imageData.data;
      
      let protectedCount = 0;
      let totalChecks = 0;
      
      for (let i = 0; i < Math.min(400, data.length); i += 4) {
        for (let j = 0; j < 3; j++) {
          if ((data[i + j] & 3) === 3 || (data[i + j] & 3) === 0) {
            protectedCount++;
          }
          totalChecks++;
        }
      }
      
      return (protectedCount / totalChecks) > 0.8;
    } catch (error) {
      throw new Error('Failed to verify image protection');
    }
  }

  static async encode(imageFile, message, password = null) {
    try {
      const isProtected = !!password;
      let finalMessage = message;

      if (isProtected) {
        if (!password) {
          throw new Error('Password required for protected mode');
        }
        finalMessage = `${password}:${message}`;
      }

      const { imageData, canvas, ctx } = await this.getImageData(imageFile);
      const data = imageData.data;
      const binaryMessage = this.textToBinary(finalMessage);
      
      // Calculate maximum message size (3 bits per pixel * number of pixels - space for length)
      const maxMessageSize = Math.floor((data.length / 4) * 3) - 44;
      
      if (binaryMessage.length > maxMessageSize) {
        throw new Error('Message too large for this image');
      }

      this.processData(data, binaryMessage, isProtected, true);
      ctx.putImageData(imageData, 0, 0);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      throw new Error(`Process failed: ${error.message}`);
    }
  }

  static async decode(imageFile, password = null) {
    try {
      const isProtected = !!password;
      const { imageData } = await this.getImageData(imageFile);
      const data = imageData.data;
      
      const detectedProtection = await this.verifyProtection(imageFile);
      
      if (detectedProtection && !isProtected) {
        throw new Error('This image requires a password');
      }
      
      if (!detectedProtection && isProtected) {
        throw new Error('This image is not password protected');
      }
      
      const binaryMessage = this.processData(data, null, isProtected, false);
      const message = this.binaryToText(binaryMessage);
      
      if (isProtected) {
        const [storedPassword, ...messageParts] = message.split(':');
        if (!password) {
          throw new Error('Password required for decryption');
        }
        if (storedPassword !== password) {
          throw new Error('Invalid password');
        }
        return messageParts.join(':');
      }
      
      return message;
    } catch (error) {
      throw new Error(`Process failed: ${error.message}`)
    }
  }
}