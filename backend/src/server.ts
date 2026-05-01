import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { pool } from './db/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Knowledge Operations API is running' });
});

// Start Server and Test DB
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database!');
        client.release();
    } catch (error) {
        console.error('Failed to connect to the database:', error);
    }
});