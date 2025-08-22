// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdGONbxp0mDEbDIk0Ul2ljtDjHeP6G7Sg",
  authDomain: "webtalk-8c2d0.firebaseapp.com",
  projectId: "webtalk-8c2d0",
  storageBucket: "webtalk-8c2d0.appspot.com",
  messagingSenderId: "819488927810",
  appId: "1:819488927810:web:572f51117a52e141b0fddb",
  measurementId: "G-Y9L36FDR2V",
  databaseURL: "https://webtalk-8c2d0-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);


export { app, auth, db, analytics };
