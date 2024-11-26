import ExecutorRepo from '@src/repos/ExecutorRepo';
import {ICompleteLogger} from '@src/models/Executor';

/**
 * Get all with future dates.
 */
function getAllExecutors(): Promise<ICompleteLogger[]> {
  return ExecutorRepo.getAllExecutors();
}

/**
 * Add an executor entry.
 */
function createExecutor(executor: ICompleteLogger): Promise<void> {
  return ExecutorRepo.createExecutor(executor);
}

export default {
  getAllExecutors,
  createExecutor,
} as const;