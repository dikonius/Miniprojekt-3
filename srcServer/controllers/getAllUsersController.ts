import type { Request, Response } from 'express';
import { db, tableName } from '../data/dynamoDB.js';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { JwtPayload } from '../data/types.js';
import jwt from 'jsonwebtoken';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Check access level
    if (payload.accessLevel !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { Items } = await db.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: '#pk = :user',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':user': 'USER' },
      ProjectionExpression: 'sk, username, accessLevel'
    }));

    res.json({ success: true, users: Items });
  } catch (error) {
    console.error('Get all users error:', (error as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
