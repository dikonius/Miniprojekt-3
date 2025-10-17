import type { Request, Response } from 'express';
import { db, tableName } from '../data/dynamoDB.js';
import { updateUserSchema } from '../data/validation.js';
import type { JwtPayload } from '../data/types.js';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const updateUser = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing or invalid token' });

    const token = authHeader.slice(7).trim();

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ errors: result.error.issues });

        const { username, password } = result.data;
        if (!username && !password) return res.status(400).json({ message: 'Nothing to update' });

        const ExpressionAttributeNames: Record<string, string> = {};
        const ExpressionAttributeValues: Record<string, any> = {};
        let UpdateExpression = 'SET';

        if (username) {
            const { Items } = await db.send(new QueryCommand({
                TableName: tableName,
                IndexName: 'username-index',
                KeyConditionExpression: '#u = :username',
                ExpressionAttributeNames: { '#u': 'username' },
                ExpressionAttributeValues: { ':username': username },
            }));

            const existingUser = Items?.[0];
            if (existingUser && existingUser.sk !== payload.userId) return res.status(400).json({ message: 'Username already taken' });

            UpdateExpression += ' #u = :username,';
            ExpressionAttributeNames['#u'] = 'username';
            ExpressionAttributeValues[':username'] = username;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            UpdateExpression += ' #p = :password,';
            ExpressionAttributeNames['#p'] = 'password';
            ExpressionAttributeValues[':password'] = hashedPassword;
        }

        UpdateExpression = UpdateExpression.replace(/,$/, '');

        await db.send(new UpdateCommand({
            TableName: tableName,
            Key: { pk: 'USER', sk: payload.userId },
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
        }));

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update error:', (error as Error).message);
        res.status(401).json({ success: false, message: 'Invalid JWT or server error' });
    }
};
