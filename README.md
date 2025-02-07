# Steganography Studio

A sophisticated steganography application for securely embedding messages within images. Built with modern web technologies and running entirely in your browser for maximum privacy and security.

![Steganography Studio](https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=1200&h=400)

## 🌟 Features

- **Advanced Steganography**: Embed messages securely within images using LSB (Least Significant Bit) technique
- **Password Protection**: Optional encryption for enhanced security
- **Client-side Processing**: All operations performed locally in your browser
- **Modern Interface**: Sleek dark theme with emerald accents
- **Drag & Drop**: Intuitive file handling
- **Real-time Preview**: Instant image preview before processing
- **Comprehensive Validation**: Robust error handling and user feedback

## 🚀 Quick Start

1. Visit [ Website !](https://steganographybykhp.netlify.app)
2. Choose between Process (encode) or Extract (decode)
3. Upload an image via drag & drop or file selection
4. For encoding:
   - Enter your message
   - Optionally enable password protection
   - Click "Process Image"
   - Download the processed image
5. For decoding:
   - Upload a processed image
   - Enter password if required
   - Click "Extract Data"
   - View the hidden message

## 💻 Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/steganography-studio.git

# Navigate to project directory
cd steganography-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔒 Security Features

### Steganography Implementation

- Uses LSB (Least Significant Bit) technique for message embedding
- Optional password protection with message encryption
- Automatic protection detection
- Secure error handling to prevent data leakage

### Privacy Considerations

- Zero server communication - all processing happens locally
- No data storage or tracking
- Images never leave your browser
- Password hashing for protected mode

## 🛠️ Technical Details

### Built With

- **React** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Canvas API** - Image processing

### Core Components

- `SteganographyService` - Handles all steganography operations
- `ImageProcessor` - Manages image data manipulation
- `SecurityValidator` - Ensures data integrity and protection

## 📝 Usage Guidelines

### Best Practices

- Use high-quality, uncompressed images
- Prefer PNG format for better results
- Keep messages within reasonable length
- Save password in a secure location
- Use password protection for sensitive data

### Limitations

- Message size limited by image dimensions
- PNG output only (to prevent data loss)
- Browser memory constraints apply
- Some image formats may not be supported

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Created by [Kushal](https://github.com/Kushal129)
- Inspired by modern steganography techniques
- Built with privacy and security in mind