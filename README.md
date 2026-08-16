# 🧘 SwasthyaYoga (ఆరోగ్య యోగా)

> **AI-Powered Personalized Yoga Therapy, On-Device Real-Time Pose Correction & Multilingual Health Companion**

SwasthyaYoga is a state-of-the-art mobile application built to provide personalized yoga therapy routines, real-time camera-based posture detection & feedback, multilingual AI health recommendations (English, Telugu, Hindi), and daily streak tracking using ICMR & WHO health guidelines.

---

## 📌 Table of Contents
1. [App Starting Point & Entry Flow](#-app-starting-point--entry-flow)
2. [Tech Stack & Architecture Justification](#-tech-stack--architecture-justification)
3. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
4. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
5. [Connecting & Running on a Physical Android Phone](#-connecting--running-on-a-physical-android-phone)
6. [Connecting & Running on Android Studio Emulator](#-connecting--running-on-android-studio-emulator)
7. [Project Directory Structure](#-project-directory-structure)
8. [Troubleshooting & Common Fixes](#-troubleshooting--common-fixes)

---

## 🏁 App Starting Point & Entry Flow

When the app launches on an Android or iOS device, execution follows this precise sequence:

1. **`index.js`**: Registers the main application component with React Native's `AppRegistry`.
2. **`App.tsx`**: Initializes the React Navigation stack container and state listeners.
3. **Screen Navigation Stack**:
   * **`WelcomeScreen.js`**: Initial landing screen handling Phone OTP and Google Authentication.
   * **`DashboardScreen.js`**: Home screen displaying daily yoga streak, quick actions, and health features.
   * **`SmartPoseCameraScreen.js`**: Real-time AI pose detection camera feed with voice & gesture controls.
   * **`HealthYogaScreen.js`**: Multilingual AI yoga therapy for conditions (Back Pain, PCOD, Thyroid, Diabetes, etc.).
   * **`WeightCheckScreen.js`**: South Asian (ICMR/WHO) BMI calculator with height parsing (`5.7` ft.in / `67` in / `170` cm).
   * **`YogaLibraryScreen.js`**: Categorized yoga pose library with animated instructions and Wikipedia imagery.

---

## 🛠️ Tech Stack & Architecture Justification

| Technology | Role in Project | Why We Selected This Technology |
| :--- | :--- | :--- |
| **React Native (0.72.6)** | Mobile Framework | Provides native 60 FPS UI performance for Android & iOS from a unified JavaScript/TypeScript codebase. |
| **On-Device MediaPipe + Biomechanical AI Classifier** | AI Pose Detection | Runs **100% offline directly on the mobile device** via joint angle calculation (`PoseDetectionService.js`). No mandatory external Python server required, zero latency, and complete user camera privacy. |
| **Google Gemini API (`gemini-1.5-flash`)** | Generative AI Health Therapy | Generates personalized 5-Asana routines, diet plans, and recovery timelines tailored to user health queries in English, Telugu, and Hindi. |
| **Dynamic Local Fallback Engine** | Offline Resilience | If mobile data is disabled or API keys are unavailable, `healthAIService.js` generates complete structured therapy routines offline so the app **never crashes or displays error dialogs**. |
| **React Native WebView** | Camera Feed Rendering | Hosts the lightweight, high-performance MediaPipe JS framework for seamless landmark extraction inside `SmartPoseCameraScreen.js`. |
| **Firebase Auth & Firestore** | Authentication & Cloud Sync | Handles phone OTP verification, Google Sign-In credentials, and cloud streak backups. |
| **AsyncStorage** | Local Cache Storage | Caches user preferences, completed sessions, and daily streak data locally for offline usage. |

---

## 📋 Prerequisites & System Requirements

Before running the project, ensure your computer has the following tools installed:

1. **Node.js**: Version `18.x` or `20.x` ([Download Node.js](https://nodejs.org/))
2. **Java Development Kit (JDK)**: OpenJDK `17` ([Download JDK 17](https://adoptium.net/))
3. **Android Studio**: Latest version with Android SDK Platform 33/34 and Android SDK Build-Tools.
4. **Git**: Installed and configured ([Download Git](https://git-scm.com/))

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Clone the Repository
Open PowerShell or Terminal and run:
```powershell
git clone https://github.com/rakshitha1888226/SwasthyaYoga.git
cd SwasthyaYoga
```

### Step 2: Install Node Dependencies
```powershell
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root folder of the project:
```powershell
# Copy the template
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(Note: `.env` is included in `.gitignore` to prevent committing secrets to GitHub).*

---

## 📱 Connecting & Running on a Physical Android Phone

Follow these exact steps to run the app directly on your physical Android mobile device:

### Step 1: Enable Developer Options on Your Phone
1. Open **Settings** on your Android phone.
2. Go to **About Phone** ➔ **Software Information**.
3. Tap **Build Number** **7 times** until you see the message `"You are now a developer!"`.

### Step 2: Enable USB Debugging
1. Go back to **Settings** ➔ System ➔ **Developer Options**.
2. Turn ON **USB Debugging**.

### Step 3: Connect Phone to PC via USB
1. Plug your phone into your computer using a USB data cable.
2. On your phone screen, a prompt will appear: `"Allow USB debugging?"`.
3. Check the box **"Always allow from this computer"** and tap **Allow**.

### Step 4: Verify Device Connection via ADB
Open PowerShell or Terminal and run:
```powershell
adb devices
```
**Expected Output**:
```text
List of devices attached
10BD9M1KYY000C3    device
```
*(If it shows `unauthorized`, unlock your phone screen and accept the USB Debugging permission prompt).*

### Step 5: Launch Metro Bundler & Run App
1. Open **Terminal 1** and start Metro bundler:
   ```powershell
   npm start
   ```
2. Open **Terminal 2** and deploy to your phone:
   ```powershell
   npm run android
   ```

---

## 💻 Connecting & Running on Android Studio Emulator

If you prefer to run the app on an Android Studio Virtual Device (AVD), follow these steps:

### Step 1: Set Up Android Virtual Device (AVD)
1. Open **Android Studio**.
2. Click **More Actions** ➔ **Virtual Device Manager** (or click the Device Manager icon).
3. Click **Create Device**.
4. Select **Pixel 6** (or any phone with Google Play Services) and click **Next**.
5. Select System Image **API Level 33 or 34** (Tiramisu / UpsideDownCake) and click **Download** if not downloaded.
6. Click **Finish**.

### Step 2: Launch the Emulator
1. In Device Manager, click the **Play (▶️)** button next to your virtual device.
2. Wait for the emulator screen to fully boot up to the Android home screen.

### Step 3: Verify Emulator Connection
In Terminal, run:
```powershell
adb devices
```
**Expected Output**:
```text
List of devices attached
emulator-5554    device
```

### Step 4: Run the Application
1. Start Metro bundler in **Terminal 1**:
   ```powershell
   npm start
   ```
2. Deploy to emulator in **Terminal 2**:
   ```powershell
   npm run android
   ```

---

## 📂 Project Directory Structure

```text
SwasthyaYoga1/
├── App.tsx                        # Main App entry stack & navigation configuration
├── index.js                       # React Native Root Registry
├── package.json                   # Project dependencies and script shortcuts
├── tsconfig.json                  # TypeScript compiler settings
├── .env                           # Local private environment secrets (Git-ignored)
├── .env.example                   # Public environment variable template
├── README.md                      # Complete project documentation & setup guide
│
├── android/                       # Android native project files & assets
│   └── app/src/main/assets/
│       └── scaler_params.json     # Standardized keypoint normalization values
│
└── src/
    └── features/
        ├── auth/                  # Authentication screens & components
        │   └── WelcomeScreen.js   # Phone OTP & Google Sign-In landing page
        │
        ├── dashboard/             # Main application dashboard
        │   └── DashboardScreen.js # Streaks, quick health actions & navigation cards
        │
        ├── pose/                  # On-Device AI Pose Detection Feature
        │   ├── SmartPoseCameraScreen.js # Real-time camera WebView & feedback UI
        │   └── PoseDetectionService.js   # 3D Biomechanical joint angle classifier
        │
        ├── health/                # AI Health Therapy & Healthy Weight Check
        │   ├── HealthYogaScreen.js      # Multilingual condition lookup screen
        │   ├── WeightCheckScreen.js     # South Asian ICMR/WHO BMI calculator
        │   ├── healthAIService.js       # Gemini API client & offline fallback engine
        │   └── Healthdata.js            # Pre-configured offline therapy datasets
        │
        ├── library/               # Yoga Pose Library
        │   ├── YogaLibraryScreen.js     # Categorized yoga poses display
        │   └── yogaLibraryService.js    # Pose metadata & Wikipedia image fetcher
        │
        └── streak/                # User Streak Tracking Feature
            ├── StreakBoard.js           # Visual 7-day streak calendar component
            └── StreakService.js         # Firebase & AsyncStorage streak sync manager
```

---

## 🔧 Troubleshooting & Common Fixes

### 1. `npm error could not determine executable to run`
* **Cause**: Missing hyphen in `react native`.
* **Fix**: Run `npm run android` or `npx react-native run-android`.

### 2. `Height must be between 80 and 220 cm` error in Weight Check
* **Cause**: Entering height as feet/inches when `in` mode is selected.
* **Fix**: The app now automatically converts all formats (`5.7` ft.in, `67` total inches, or `170` cm).

### 3. LogBox Yellow Warning Box on Phone
* **Cause**: `console.warn` calls in development mode.
* **Fix**: All warning overlays have been replaced with silent `console.log` logging for seamless UI testing.

---

### 📄 License
This project is developed for **SwasthyaYoga** — empowering holistic health, multilingual therapy, and accessible AI pose feedback.
