import {ICompleteLogger} from '@src/models/Executor';
import orm from '@src/repos/MockOrm';

async function getAllExecutors(): Promise<ICompleteLogger[]> {
  const db = await orm.openDb();
  const completeLogger: ICompleteLogger[] = [];

  const lastTwentyExecutors = db.executors.slice(-20);
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

export default {
  getAllExecutors,
} as const;