/**
 * Express router paths go here.
 */


export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Entries: {
    Base: '/entries',
    Add: '/add',
    GetFuture: '/get-future',
    Delete: '/delete/:id',
  },
  Executors: {
    Base: '/executors',
    Get: '/all',
  }
} as const;
