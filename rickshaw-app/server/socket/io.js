/**
 * Shared Socket.io instance store.
 *
 * This lets us emit events from anywhere in the codebase (e.g. controllers)
 * without circular-dependency issues. Call setIO() once in server.js after
 * the io instance is created, then use getIO() wherever you need it.
 */

let _io = null;

/** Store the io instance at startup. */
export const setIO = (io) => {
  _io = io;
};

/** Retrieve the io instance. Returns null if setIO has not been called yet. */
export const getIO = () => _io;
