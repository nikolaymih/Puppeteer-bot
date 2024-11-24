import ExecutorRepo from '@src/repos/ExecutorRepo';
import {ICompleteLogger} from '@src/models/Executor';

/**
 * Get all with future dates.
 */
function getAllExecutors(): Promise<ICompleteLogger[]> {
  return ExecutorRepo.getAllExecutors();
}

export default {
  getAllExecutors,
} as const;