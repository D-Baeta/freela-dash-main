
# Firestore Database Setup

This document provides instructions on how to set up a Firestore database for this project.

## 1. Create a Firebase Project

- Go to the [Firebase console](https://console.firebase.google.com/).
- Click on "Add project" and follow the instructions to create a new project.

## 2. Get Firebase Configuration

- In your Firebase project, go to the project settings.
- Under "Your apps", create a new web app.
- You will be given a `firebaseConfig` object. Copy this object.

## 3. Configure `firebase-config.js`

- Open the `src/firebase-config.js` file in this project.
- Replace the placeholder values in the `firebaseConfig` object with the values you copied from the Firebase console.

## 4. Enable Firestore

- In the Firebase console, go to the "Firestore Database" section.
- Click on "Create database".
- Choose "Start in test mode" for development purposes. This will allow all reads and writes to the database.
- **Note:** For production, you will need to set up proper security rules.

## 5. Using Firestore

- The `src/firebase-config.js` file exports a `db` object, which is your Firestore database instance.
- You can import this `db` object into any component to interact with the database.

- The `src/firebase-config.js` file also exports an `auth` object, which is your Firebase authentication instance.
- You can import this `auth` object into any component to handle user authentication.

## 6. Further Reading

- For more information on how to use Firestore, please refer to the [Firebase documentation](https://firebase.google.com/docs/firestore).
