import { db, tableName } from '../data/dynamoDB.js';
import { loginSchema } from '../data/validation.js';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const jwtSecret = process.env.JWT_SECRET;
export const loginUser = async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(issue => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
        }));
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
        const user = Items?.[0];
        if (!user)
            return res.status(401).json({ success: false, message: 'User not found' });
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch)
            return res.status(401).json({ success: false, message: 'Invalid password' });
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 15 * 60;
        const payload = { userId: user.sk, accessLevel: user.accessLevel, exp };
        const token = jwt.sign(payload, jwtSecret);
        res.json({ success: true, token, user: { id: user.sk, username: user.username, accessLevel: user.accessLevel } });
    }
    catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
//# sourceMappingURL=loginController.js.map