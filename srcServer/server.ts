import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { MessageResponse } from './data/types.js';
import authRoute from './routes/auth.js'

const app: Express = express();
const port: number = Number(process.env.PORT) || 1337;
const jwtSecret: string = process.env.JWT_SECRET!;

// Logger middleware
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method}  ${req.url}`);
  next();
};

app.use('/', logger);
app.use(express.json());
app.use(express.static('./frontend/'));

// Mount routes
app.get('/public', (req: Request, res: Response<MessageResponse>) => {
  res.send({ message: 'Welcome to Studio Ghibli!' });
});

app.use('/auth', authRoute );


app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});