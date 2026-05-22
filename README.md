# AthleteShield: Edge-Computed Diagnostic Suite

AthleteShield is a zero-latency, privacy-first web application designed for rapid, on-device concussion diagnostics. 

This repository contains the frontend React application, engineered to tap directly into native mobile hardware to perform clinical-grade vestibular analysis without transmitting continuous tracking data over the network.

## Core Protocol: Tri-Axial Postural Sway
The primary diagnostic tool is a 20-second vestibular balance analysis. 
* Taps into the HTML5 `DeviceMotionEvent` API.
* Ingests tri-axial accelerometer telemetry at a strict 50Hz frequency.
* Computes high-pass filtering, variance, and the 95% Confidence Ellipse (Sway Area) entirely on the device edge via our custom `useSway.js` math engine.

## File Architecture Overview
If you are diving into the `src/` folder to integrate backend connections or tweak the UI, here is how the system is routed:

* **`App.jsx`**: The main entry point. Currently locked to boot directly into the mobile protocol for focused testing.
* **`useSway.js`**: The local compute engine. All mathematical signal processing, baseline scoring, and hardware simulation logic lives here.
* **`PosturalSway.jsx`**: The mobile UI layer containing the countdown, live waveform canvas, and clinical result rendering.
* **`CognitiveClick.jsx`**: An alternative Go/No-Go cognitive inhibition test designed for desktop environments (currently bypassed in `App.jsx` routing but preserved for future dual-mode deployment).

## Local Development & Mobile Testing

To run the local development server and test the physical accelerometer on a mobile device, your phone and laptop **must** be on the exact same Wi-Fi network.

1. Install dependencies:
   ```bash
   npm install