import { db, tableName } from '../data/dynamoDB.js';
import { loginSchema, updateUserSchema } from '../data/validation.js';
import { QueryCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const jwtSecret = process.env.JWT_SECRET;
// Register new user
export const registerUser = async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        return res.status(400).json({ errors });
    }
    const { username, password } = result.data;
    try {
        // Check if user already exists (using GSI)
        const queryCommand = new QueryCommand({
            TableName: tableName,
            IndexName: 'username-index',
            KeyConditionExpression: '#u = :username',
            ExpressionAttributeNames: { '#u': 'username' },
            ExpressionAttributeValues: { ':username': username },
        });
        const { Items } = await db.send(queryCommand);
        if (Items && Items.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `USER#${crypto.randomUUID()}`;
        ;
        const newUser = {
            pk: 'USER',
            sk: userId,
            username,
            password: hashedPassword,
            accessLevel: 'user',
        };
        await db.send(new PutCommand({ TableName: tableName, Item: newUser }));
        res.status(201).send({ success: true, user: { id: userId, username } });
    }
    catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).send({ success: false });
    }
};
// Login
export const loginUser = async (req, res) => {
    // Validate request body
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        return res.status(400).json({ errors });
    }
    const { username, password } = result.data;
    console.log("Login attempt for:", username);
    try {
        // Query user by username using GSI
        const queryCommand = new QueryCommand({
            TableName: tableName,
            IndexName: "username-index",
            KeyConditionExpression: "#u = :username",
            ExpressionAttributeNames: { "#u": "username" },
            ExpressionAttributeValues: { ":username": username },
        });
        const { Items } = await db.send(queryCommand);
        const user = Items?.[0];
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        console.log("Comparing passwords:");
        console.log("From DB:", user.password);
        console.log("From request:", password);
        // Use bcrypt to compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        console.log("Password matched, generating token");
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 15 * 60; // Token expires in 15 minutes
        const payload = { userId: user.sk, exp };
        const token = jwt.sign(payload, jwtSecret);
        return res.json({
            success: true,
            token,
            user: { id: user.sk, username: user.username },
        });
    }
    catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
// Secret route (JWT-protected)
export const getSecret = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Missing or invalid token' });
    }
    const token = authHeader.slice(7).trim();
    try {
        const payload = jwt.verify(token, jwtSecret);
        const getCommand = new GetCommand({
            TableName: tableName,
            Key: { pk: 'USER', sk: payload.userId },
        });
        const { Item: user } = await db.send(getCommand);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.send({ message: `Welcome ${user.username}! Access level: ${user.accessLevel}` });
    }
    catch (error) {
        res.status(401).send({ message: 'Invalid JWT' });
    }
};
// updateUser
export const updateUser = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Missing or invalid token' });
    }
    const token = authHeader.slice(7).trim();
    try {
        const payload = jwt.verify(token, jwtSecret);
        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            }));
            return res.status(400).json({ errors });
        }
        const { username, password } = result.data;
        if (!username && !password) {
            return res.status(400).json({ message: 'Nothing to update' });
        }
        const ExpressionAttributeNames = {};
        const ExpressionAttributeValues = {};
        let UpdateExpression = 'SET';
        // If user wants to change username, check uniqueness first
        if (username) {
            const queryCommand = new QueryCommand({
                TableName: tableName,
                IndexName: 'username-index',
                KeyConditionExpression: '#u = :username',
                ExpressionAttributeNames: { '#u': 'username' },
                ExpressionAttributeValues: { ':username': username },
            });
            const { Items } = await db.send(queryCommand);
            const existingUser = Items?.[0];
            if (existingUser && existingUser.sk !== payload.userId) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            UpdateExpression += ' #u = :username,';
            ExpressionAttributeNames['#u'] = 'username';
            ExpressionAttributeValues[':username'] = username;
        }
        // If password needs to be updated, hash it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            UpdateExpression += ' #p = :password,';
            ExpressionAttributeNames['#p'] = 'password';
            ExpressionAttributeValues[':password'] = hashedPassword;
        }
        // Remove trailing comma
        UpdateExpression = UpdateExpression.replace(/,$/, '');
        await db.send(new UpdateCommand({
            TableName: tableName,
            Key: { pk: 'USER', sk: payload.userId },
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
        }));
        return res.json({ success: true, message: 'User updated successfully' });
    }
    catch (error) {
        console.error('Update error:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid JWT or server error' });
    }
};
//# sourceMappingURL=authController.js.map