const path = require('path');
const fse = require('fs-extra');
const { JsonContext } = require('./json_context');
const { Context } = require('./context');
const { loadMigrationsFromDir, Migration } = require('./migration');

/**
 * Run a migration in a particular direction
 * 
 * @param {'up'|'down'} direction
 * @param {Object} options
 *   @param {import('./context').Context} options.context
 *   @param {Migration[]} options.migrations
 * 
 * @returns {Promise<void>}
 */
exports.run = async (
  direction,
  {
    migrations = loadMigrationsFromDir('./migrations'),
    context = new JsonContext('./migrations/migrations.json')
  },
) => {
  await context._getState();

  switch (direction) {
    case 'up':
      await up(context, migrations);
      break;

    case 'down':
      await down(context, migrations);
      break;

    default:
      throw new Error('Run was called with a direction other than up or down.');
  }

  await context._saveState();
};

/**
 * Run the migration up
 * 
 * @param {Context} ctx The migration context
 * @param {Migration[]} migrations
 *
 * @returns {Promise<void>}
 */
async function up(ctx, migrations) {
  const currentId = ctx.state.length > 0
    ? ctx.state[ctx.state.length - 1].id
    : null;

  let migrationCount = 0;

  // Check to see if each migration needs to be run

  /**
   * @type {Promise<void>}
   */
  let promiseChain = Promise.resolve();
  migrations.filter(({ id: toApply }) => !currentId || currentId < toApply)
    .forEach(({ id, name, up }) => {
      if (!up) {
        return;
      }

      migrationCount += 1;
      // @ts-ignore
      promiseChain = promiseChain
        .then(() => {
          console.log('Running migration:', name, `(${id})`)
        })
        .then(() => up(ctx));
    });

  // Add the last run migration to the state
  if (migrationCount > 0) {
    return promiseChain.then(() => {
      const migration = migrations.slice(-1)[0]
      ctx.state.push(migration.toExecuted(new Date()))
    });
  } else {
    return promiseChain.then(() => {
      console.log('No migrations to run')
    });
  }
};

/**
 * Run the migration down
 * 
 * @param {Context} ctx The migration context
 * @param {Migration[]} migrations
 *
 * @returns {Promise<void>}
 */
async function down(ctx, migrations) {
  const currentId = ctx.state.length > 0
    ? ctx.state[ctx.state.length - 1].id
    : null;

  const previosId = ctx.state.length > 1
    ? ctx.state[ctx.state.length - 2].id
    : null;

  let migrationCount = 0;

  // Check to see if each migration needs to be run
  let promiseChain = Promise.resolve();
  migrations.filter(({ id: toRevert }) => {
    // No migrations ran yet
    if (!currentId) {
      return false;
    }

    // We have at least 2 migrations already, and we need to revert up to the previous one
    if (previosId) {
      return previosId < toRevert && toRevert <= currentId;
    }

    // We have exactly 1 migration and we need to revert everything up to that point
    // But not any future ones, which were not executed (up) yet.
    return toRevert <= currentId;
  })
    .forEach(({ id, name, down }) => {
      if (!down) {
        return;
      }

      migrationCount += 1;
      // @ts-ignore
      promiseChain = promiseChain
        .then(() => {
          console.log('Reversing migration:', name, `(${id})`)
        })
        .then(() => down(ctx))
    });

  // Remove the last run migration from the state
  if (migrationCount > 0) {
    return promiseChain.then(() => {
      ctx.state.pop()
    })
  } else {
    return promiseChain.then(() => {
      console.log('No migrations to run')
    })
  }
};
