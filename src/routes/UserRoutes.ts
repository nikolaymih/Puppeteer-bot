import HttpStatusCodes from '@src/common/HttpStatusCodes';

// import UserService from '@src/services/UserService';
import { IUser } from '@src/models/User';
import { IReq, IRes } from './types/express/misc';


// **** Functions **** //

/**
 * Get all users.
 */
function getAll(_: IReq, res: IRes) {
  // const users = await UserService.getAll();
  return res.status(HttpStatusCodes.OK).json('{ users }');
}

/**
 * Add one user.
 */
function add(req: IReq<{user: IUser}>, res: IRes) {
  // const { user } = req.body;
  // await UserService.addOne(user);
  return res.status(HttpStatusCodes.CREATED).end();
}

/**
 * Update one user.
 */
function update(req: IReq<{user: IUser}>, res: IRes) {
  // const { user } = req.body;
  // await UserService.updateOne(user);
  return res.status(HttpStatusCodes.OK).end();
}

/**
 * Delete one user.
 */
function delete_(req: IReq, res: IRes) {
  // const id = +req.params.id;
  // await UserService.delete(id);
  return res.status(HttpStatusCodes.OK).end();
}


// **** Export default **** //

export default {
  getAll,
  add,
  update,
  delete: delete_,
} as const;
