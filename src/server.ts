/**
 * Setup express server.
 */

import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import express, {Request, Response, NextFunction} from 'express';
import logger from 'jet-logger';
import 'express-async-errors';

import BaseRouter from '@src/routes';

import Paths from '@src/common/Paths';
import EnvVars from '@src/common/EnvVars';
import HttpStatusCodes from '@src/common/HttpStatusCodes';
import RouteError from '@src/common/RouteError';
import {NodeEnvs} from '@src/common/misc';
import {mainPuppeteer} from '@src/puppeteer';

// **** Variables **** //

const app = express();

// **** Setup **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(EnvVars.CookieProps.Secret));

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.Dev.valueOf()) {
  app.use(morgan('dev'));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.Production.valueOf()) {
  app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((
  err: Error,
  _: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (EnvVars.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
  }
  return res.status(status).json({error: err.message});
});


// **** Front-End Content **** //

// Set views directory (html)
const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Nav to users pg by default
app.get('/', async (_: Request, res: Response) => {
  const entry = {
    id: '1',
    representative: 'Юридическо лице',
    firstName: 'test',
    middleName: 'test',
    lastName: 'test',
    securityNumber: 'test',
    documentNumber: 'test',
    issuedOn: '15-05-2016',
    issuer: 'МВР ВАРНА',
    bullstat: '231321',
    regNumber: 'B9699НТ',
    parentEntryId: '1',
    startDay: '2024-11-24 18:02:30',
    purchaseDoc: 'test',
    powerAttorney: 'test2',
    isPrimaryNum: false,
  };

  await mainPuppeteer(entry);

  res.status(200).end();
});


// Redirect to login if not logged in.
app.get('/users', (_: Request, res: Response) => {
  return res.sendFile('entries.html', {root: viewsDir});
});


// **** Export default **** //

export default app;
