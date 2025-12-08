# 🏗️ Quick Build Instructions

## 📱 Build Android APK (for testing on devices)

```bash
cd /app/frontend

# Build React app
npm run build

# Sync to native project
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# - Build → Build Bundle(s) / APK(s) → Build APK(s)
# - Find APK in: android/app/build/outputs/apk/debug/app-debug.apk
# - Transfer to phone and install
```

## 📦 Build Android AAB (for Play Store)

```bash
cd /app/frontend

# Build React app
npm run build

# Sync to native project
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Select "Android App Bundle"
# 3. Create keystore (save password!)
# 4. Select "release" build variant
# 5. Output: android/app/release/app-release.aab
```

## 🍎 Build iOS IPA (for App Store)

```bash
cd /app/frontend

# Build React app
npm run build

# Install iOS dependencies
cd ios/App && pod install && cd ../..

# Sync to native project
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device (arm64)" as target
# 2. Product → Archive
# 3. Wait for archive to complete
# 4. Window → Organizer
# 5. Select your archive
# 6. Click "Distribute App"
# 7. Choose "App Store Connect"
# 8. Upload
```

## 🧪 Run on Emulator/Simulator

### Android Emulator:
```bash
cd /app/frontend
npx cap run android
```

### iOS Simulator (Mac only):
```bash
cd /app/frontend
npx cap run ios
```

## 📝 Before Each Build

**ALWAYS run these steps before building:**

```bash
cd /app/frontend

# 1. Update any code changes
# 2. Build React app
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Then open in respective IDE and build
```

## 🔧 Update App After Code Changes

```bash
cd /app/frontend

# 1. Make your code changes in src/
# 2. Build
npm run build

# 3. Sync
npx cap sync

# 4. App automatically updated in native projects!
```

## 🆘 Troubleshooting

### Build fails?
```bash
cd /app/frontend

# Clean everything
rm -rf build node_modules
npm install --legacy-peer-deps
npm run build
npx cap sync
```

### Android Gradle errors?
```bash
cd /app/frontend/android
./gradlew clean
cd ..
npx cap sync android
```

### iOS Pod errors?
```bash
cd /app/frontend/ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

---

**That's it! You're ready to build! 🚀**
