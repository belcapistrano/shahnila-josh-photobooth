# Photobooth Web App

A simple, modern photobooth web application built with React and Vite.

## Features

- Real-time camera preview using WebRTC
- Capture photos with a single click
- Photo gallery with grid layout
- Download individual photos
- Delete unwanted photos
- Responsive design for mobile and desktop
- Clean, modern UI with gradient background

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **WebRTC** - Camera access via getUserMedia API
- **Canvas API** - Photo capture and processing

## Project Structure

```
photobooth/
├── src/
│   ├── components/
│   │   ├── Camera.jsx           # Camera preview and capture
│   │   ├── CaptureButton.jsx    # Capture button component
│   │   ├── PhotoGallery.jsx     # Photo gallery display
│   │   └── PhotoCard.jsx        # Individual photo card
│   ├── hooks/
│   │   ├── useCamera.js         # Camera access logic
│   │   ├── usePhotoCapture.js   # Photo capture functionality
│   │   └── useLocalStorage.js   # LocalStorage persistence
│   ├── styles/
│   │   └── App.css              # Global styles
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Usage

1. Allow camera permissions when prompted
2. Click the capture button to take a photo
3. View your photos in the gallery below
4. Download or delete photos using the buttons on each photo card

## Browser Compatibility

- Chrome/Edge 53+
- Firefox 36+
- Safari 11+
- Opera 40+

Requires HTTPS in production for camera access (localhost works without HTTPS).

## Future Enhancements

- Photo filters and effects
- LocalStorage persistence
- Multiple camera support
- Photo editing tools
- Share functionality
- Countdown timer
- Burst mode
