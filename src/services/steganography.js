export class SteganographyService {
    static METHODS = {
      default: 'default',
      protected: 'protected'
    };
  
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
        for (let i = 0; i < data.length && binaryIndex < binaryMessage.length; i += 4) {
          for (let j = 0; j < 3 && binaryIndex < binaryMessage.length; j++) {
            const bit = parseInt(binaryMessage[binaryIndex]);
            if (isProtected) {
              data[i + j] = (data[i + j] & ~3) | ((bit ? 3 : 0));
            } else {
              data[i + j] = (data[i + j] & ~1) | bit;
            }
            binaryIndex++;
          }
        }
      } else {
        for (let i = 0; i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            if (isProtected) {
              result += (data[i + j] & 3) === 3 ? '1' : '0';
            } else {
              result += data[i + j] & 1;
            }
          }
        }
      }
      
      return encode ? data : result;
    }
  
    static async encode(imageFile, message, method = this.METHODS.default, password) {
      try {
        const isProtected = method === this.METHODS.protected;
        let finalMessage = message;
  
        if (isProtected && !password) {
          throw new Error('Password required for protected mode');
        }
  
        if (isProtected) {
          finalMessage = `${password}:${message}`;
        }
  
        const { imageData, canvas, ctx } = await this.getImageData(imageFile);
        const data = imageData.data;
        const binaryMessage = this.textToBinary(finalMessage) + '00000000';
        
        if (binaryMessage.length > data.length * 3) {
          throw new Error('Message too large for this image');
        }
  
        this.processData(data, binaryMessage, isProtected, true);
        ctx.putImageData(imageData, 0, 0);
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
      } catch (error) {
        throw new Error(`Process failed: ${error.message}`);
      }
    }
  
    static async verifyProtection(imageFile) {
      try {
        const { imageData } = await this.getImageData(imageFile);
        const data = imageData.data;
        
        // Check first few pixels for protected pattern
        let protectedCount = 0;
        let totalChecks = 0;
        
        // Check more pixels for better accuracy
        for (let i = 0; i < 100 && i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            if ((data[i + j] & 3) === 3 || (data[i + j] & 3) === 0) {
              protectedCount++;
            }
            totalChecks++;
          }
        }
        
        // If more than 80% of checked pixels match the protected pattern
        return (protectedCount / totalChecks) > 0.8;
      } catch (error) {
        throw new Error('Failed to verify image protection');
      }
    }
  
    static async decode(imageFile, method = this.METHODS.default, password) {
      try {
        const isProtected = method === this.METHODS.protected;
        const { imageData } = await this.getImageData(imageFile);
        const data = imageData.data;
        
        // First try to detect if the image is password protected
        const detectedProtection = await this.verifyProtection(imageFile);
        
        if (detectedProtection && !isProtected) {
          throw new Error('This image requires a password');
        }
        
        if (!detectedProtection && isProtected) {
          throw new Error('This image is not password protected');
        }
        
        const binaryMessage = this.processData(data, null, isProtected, false);
        const endIndex = binaryMessage.indexOf('00000000');
        
        if (endIndex === -1) {
          throw new Error('No valid data found');
        }
        
        const message = this.binaryToText(binaryMessage.slice(0, endIndex));
        
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
        throw new Error(`Process failed: ${error.message}`);
      }
    }
  }