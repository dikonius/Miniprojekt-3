import type { Request, Response } from 'express';
import { db, tableName } from '../data/dynamoDB.js';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { JwtPayload } from '../data/types.js';
import jwt from 'jsonwebtoken';

export const deleteUser = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.slice(7).trim();

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        await db.send(new DeleteCommand({
            TableName: tableName,
            Key: { pk: 'USER', sk: payload.userId },
        }));

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', (error as Error).message);
        res.status(401).json({ success: false, message: 'Invalid JWT or server error' });
    }
};
