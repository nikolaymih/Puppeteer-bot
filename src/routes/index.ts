import { Router } from 'express';
import jetValidator from 'jet-validator';

import Paths from '../common/Paths';
import User from '@src/models/User';
import UserRoutes from './UserRoutes';
import EntryRoutes from '@src/routes/EntryRoutes';
import mult from '../middleware/multer';
import executorRoutes from '@src/routes/ExecutorRoutes';

// **** Variables **** //
const apiRouter = Router(),
  validate = jetValidator();

// ** Add UserRouter ** //
const userRouter = Router();
const entryRouter = Router();
const executorRouter = Router();

// Get all executors
executorRouter.get(
  Paths.Executors.Get,
  executorRoutes.getAllExecutors,
);

// Create an entry
entryRouter.post(
  Paths.Entries.Add,
  mult.fields([
    { name: 'purchaseDoc', maxCount: 1 },
    { name: 'powerAttorney', maxCount: 1 },
  ]),
  EntryRoutes.add,
);

// Get all future entries
entryRouter.get(
  Paths.Entries.GetFuture,
  EntryRoutes.getAllFuture,
);

// Remove an entry
entryRouter.delete(
  Paths.Entries.Delete,
  EntryRoutes.deleteEntry,
);

// Get all users
userRouter.get(
  Paths.Users.Get,
  UserRoutes.getAll,
);

// Add one user
userRouter.post(
  Paths.Users.Add,
  validate(['user', User.isUser]),
  UserRoutes.add,
);

// Update one user
userRouter.put(
  Paths.Users.Update,
  validate(['user', User.isUser]),
  UserRoutes.update,
);

// Delete one user
userRouter.delete(
  Paths.Users.Delete,
  validate(['id', 'number', 'params']),
  UserRoutes.delete,
);

// Add UserRouter
apiRouter.use(Paths.Users.Base, userRouter);
apiRouter.use(Paths.Entries.Base, entryRouter);
apiRouter.use(Paths.Executors.Base, executorRouter);


// **** Export default **** //

export default apiRouter;
