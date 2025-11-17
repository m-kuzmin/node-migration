const path = require('path');
const fse = require('fs-extra');
const { ExecutedMigration } = require('./context');

/**
 * Represents data about a migration
 * @property {number} id
 * @property {string} name
 * @param {(ctx: import('./context').Context)=>Promise<void>?} up
 * @param {(ctx: import('./context').Context)=>Promise<void>?} down
 */
exports.Migration = class {
    /**
     * @param {number} id
     * @param {string} name
     * @param {(ctx: import('./context').Context)=>Promise<void>?} up
     * @param {(ctx: import('./context').Context)=>Promise<void>?} down
     */
    constructor(id, name, up, down) {
        this.id = id;
        this.name = name;
        this.up = up;
        this.down = down;
    }

    /**
     * Converts `Self` into a `ExecutedMigration` type that can be stored in the migration context.
     * @param {Date} date
     */
    toExecuted(date) {
        return new ExecutedMigration(this.id, this.name, date);
    }
}

/**
 * Loads the migrations from a directory.
 * 
 * Each filename has to be in the "id_name.js" format. The id is a decimal number -  unix timestamp. The name component
 * can be any string, and can contain underscores. Example filename: "4000389_create_some_table.js".
 * 
 * The file can export the `up` and `down` (optionally async) functions, which are the migration steps to execute.
 * 
 * @param {string} directory Directory to load the migration files from.
 * @returns {exports.Migration[]} The loaded migrations
 */
exports.loadMigrationsFromDir = function (directory) {
    const migrationsPath = path.resolve(directory);
    if (!fse.existsSync(migrationsPath)) {
        console.log("migration folder does not exist:", migrationsPath)
        return [];
    }

    /** @type {exports.Migration[]} */
    const migrations = [];
    fse.readdirSync(migrationsPath).forEach((filename) => {
        const migration = loadMigration(migrationsPath, filename);
        if (migration) {
            migrations.push(migration);
        }
    });

    return migrations;
}

/**
 * @param {string} directory The directory where the file is located
 * @param {string} filename Filename in format "id_name.js", where id is a decimal number, and name is any string
 * @returns {exports.Migration?}
 */
function loadMigration(directory, filename) {
    let justName = filename;
    if (justName.endsWith('.js')) {
        justName = justName.slice(0, justName.length - 3);
    }

    let underscore = justName.indexOf('_');

    let id = NaN;
    let name = '';

    if (underscore == -1) {
        id = parseInt(justName, 10);
    } else {
        id = parseInt(justName.slice(0, underscore), 10);
        name = justName.slice(underscore + 1);
    }

    if (Number.isNaN(id)) {
        return null;
    }

    let code;
    try {
        code = require(path.resolve(directory, filename));
    } catch (err) {
        return null;
    }

    let up = code.up ? code.up : null;
    let down = code.down ? code.down : null;

    return new exports.Migration(id, name, up, down);
}