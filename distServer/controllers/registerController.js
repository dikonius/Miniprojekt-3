import { db, tableName } from '../data/dynamoDB.js';
import { loginSchema } from '../data/validation.js';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
export const registerUser = async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
        return res.status(400).json({ errors });
    }
    const { username, password } = result.data;
    try {
        const { Items } = await db.send(new QueryCommand({
            TableName: tableName,
            IndexName: 'username-index',
            KeyConditionExpression: '#u = :username',
            ExpressionAttributeNames: { '#u': 'username' },
            ExpressionAttributeValues: { ':username': username },
        }));
        if (Items && Items.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `USER#${crypto.randomUUID()}`;
        const newUser = {
            pk: 'USER',
            sk: userId,
            username,
            password: hashedPassword,
            accessLevel: 'user',
        };
        await db.send(new PutCommand({ TableName: tableName, Item: newUser }));
        res.status(201).json({ success: true, user: { id: userId, username, accessLevel: 'user' } });
    }
    catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ success: false });
    }
};
//# sourceMappingURL=registerController.js.map