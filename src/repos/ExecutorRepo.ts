import {ICompleteLogger} from '@src/models/Executor';
import orm from '@src/repos/MockOrm';

async function getAllExecutors(): Promise<ICompleteLogger[]> {
  const db = await orm.openDb();
  const completeLogger: ICompleteLogger[] = [];

  const lastTwentyExecutors = db.executors.slice(-20).reverse();
  lastTwentyExecutors.forEach(executor => {
    const entry = db.entries.find(entry => entry.id === executor.entryId);

    if (entry) {
      completeLogger.push({
        ...entry,
        ...executor,
      });
    }
  });

  return completeLogger;
}

async function createExecutor(executor: ICompleteLogger): Promise<void> {
  const db = await orm.openDb();
  db.executors.push(executor);

  return orm.saveDb(db);
}

export default {
  getAllExecutors,
  createExecutor
} as const;