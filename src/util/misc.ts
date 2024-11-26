/**
 * Miscellaneous shared functions go here.
 */


import schedule, {Job} from 'node-schedule';

/**
 * Get a random number between 1 and 1,000,000,000,000
 */
export function getRandomInt(): number {
  return Math.floor(Math.random() * 1_000_000_000_000);
}

/**
 * Wait for a certain number of milliseconds.
 */
export function tick(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

export function scheduleTask(dateString: string, taskFn: () => void): Job {
  // Convert the date string to a JavaScript Date object
  const scheduledDate = new Date(dateString);

  // Validate the date
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid date format. Ensure it is in "YYYY-MM-DD HH:mm:ss".');
  }

  // Schedule the task
  const job = schedule.scheduleJob(scheduledDate, taskFn);

  console.log(`Task scheduled for: ${dateString}`);
  return job;
}
