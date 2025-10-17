import { db, tableName } from '../data/dynamoDB.js';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';
export const getSecret = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Missing or invalid token' });
    const token = authHeader.slice(7).trim();
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { Item: user } = await db.send(new GetCommand({
            TableName: tableName,
            Key: { pk: 'USER', sk: payload.userId },
        }));
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: `Welcome ${user.username}! Access level: ${user.accessLevel}` });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid JWT' });
    }
};
//# sourceMappingURL=secretController.js.map