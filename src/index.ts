import { AutoRouter, error, IRequest } from 'itty-router';
import { router as audioRouter } from './routes/audio';
import { errorHandler } from './lib/logger';

const router = AutoRouter({ catch: errorHandler });

router
    .get('/audio/*', audioRouter.fetch)
    .all('*', () => error(400));

export default router;
