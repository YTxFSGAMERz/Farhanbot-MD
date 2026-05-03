---
title: FarhanBot MD
emoji: 🤖
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# FarhanBot-MD

<div align="center">
  <img src="https://img.shields.io/badge/YTxFSGAMERz--MD-blue?style=for-the-badge&logo=whatsapp" alt="FarhanBot-MD">
</div>

---

## 🌟 Overview
**FarhanBot-MD** is a professional-grade, multi-device WhatsApp bot designed for efficiency, reliability, and ease of use. It features a robust command system, automated media handling, and cloud-native persistence via Firebase.

## 🚀 Key Features
- **Multi-Device Support**: Connect seamlessly using Baileys MD.
- **Cloud Persistence**: Session data is securely stored in Firebase, allowing for cardless deployments (e.g., Hugging Face Spaces).
- **Automated Media**: High-quality YouTube downloads, sticker creation with EXIF support, and image/video conversion.
- **Group Management**: Advanced controls for group admins to maintain order and automate tasks.
- **Lightweight & Fast**: Optimized for low RAM usage and high response speeds.
- **AI Integration**: Built-in support for GPT, Gemini, and image generation.

## 🛠️ Setup & Deployment

### 1. Cloud Deployment (Hugging Face / Others)
FarhanBot-MD is optimized for cloud environments. Use the following secrets for Firebase-backed persistence:
- `FIREBASE_CONFIG`: Your Firebase project JSON configuration.
- `SESSION_TYPE`: `firebase`
- `SESSION_ID`: Your unique session identifier (e.g., `YTxFSGAMERz-session`).

### 2. Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/YTxFSGAMERz/Farhanbot-MD.git
   cd FarhanBot-MD
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `settings.js` with your details.
4. Start the bot:
   ```bash
   npm start
   ```

## 📜 Credits & License
- **Lead Developer**: [YTxFSGAMERz](https://github.com/YTxFSGAMERz)
- **Base Library**: [Baileys](https://github.com/WhiskeySockets/Baileys)

This project is licensed under the MIT License.

---
<div align="center">
  Built with ❤️ by <b>YTxFSGAMERz</b>
</div>
