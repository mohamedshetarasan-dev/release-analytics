import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes (wired in Phase 1)
// import uploadsRouter from './routes/uploads';
// import releasesRouter from './routes/releases';
// import metricsRouter from './routes/metrics';
// app.use('/api/v1/uploads', uploadsRouter);
// app.use('/api/v1/releases', releasesRouter);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.info(`Backend running on http://localhost:${env.PORT}`);
  });
}

export default app;
