import {IReq} from '@src/routes/types/types';
import {IRes} from '@src/routes/types/express/misc';
import HttpStatusCodes from '@src/common/HttpStatusCodes';
import ExecutorService from '@src/services/ExecutorService';

async function getAllExecutors(_: IReq, res: IRes) {

  const executors = await ExecutorService.getAllExecutors();

  res.status(HttpStatusCodes.OK).json(executors).end();
}

export default {
  getAllExecutors,
} as const