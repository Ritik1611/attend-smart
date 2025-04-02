import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { db } from './firebaseConfig.js'; // Import Firestore from firebaseConfig
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

// Initialize Firebase Admin SDK using the configuration from firebaseConfig
admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Use application default credentials
    databaseURL: "https://attendsmart-62252.firebaseio.com" // Update with your Firebase project ID
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

// Fetch all attendance records
app.get('/api/attendance', async (req, res) => {
    try {
        const snapshot = await getDocs(collection(db, 'attendance'));
        const attendanceRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(attendanceRecords);
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

// Add a new attendance record
app.post('/api/attendance', async (req, res) => {
    const newRecord = req.body;
    try {
        const docRef = await addDoc(collection(db, 'attendance'), newRecord);
        res.status(201).json({ id: docRef.id, ...newRecord });
    } catch (error) {
        console.error('Error adding attendance record:', error);
        res.status(500).json({ error: 'Failed to add attendance record' });
    }
});

// Fetch all timetable records
app.get('/api/timetable', async (req, res) => {
    try {
        const snapshot = await getDocs(collection(db, 'timetable'));
        const timetableRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(timetableRecords);
    } catch (error) {
        console.error('Error fetching timetable records:', error);
        res.status(500).json({ error: 'Failed to fetch timetable records' });
    }
});

// Add a new timetable record
app.post('/api/timetable', async (req, res) => {
    const newRecord = req.body;
    try {
        const docRef = await addDoc(collection(db, 'timetable'), newRecord);
        res.status(201).json({ id: docRef.id, ...newRecord });
    } catch (error) {
        console.error('Error adding timetable record:', error);
        res.status(500).json({ error: 'Failed to add timetable record' });
    }
});

// Start the server
app.listen(PORT, (err) => {
    if (err) {
        return console.error('Failed to start server:', err);
    }
    console.log(`Server is running on http://localhost:${PORT}`);
});
