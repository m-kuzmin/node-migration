const path = require('path')
const fse = require('fs-extra')
const { Context } = require('./context');

/**
 * Saves the state to a JSON file
 * @property {string} jsonStateFile
 */
exports.JsonContext = class extends Context {
  /**
   * @param {string} file JSON file where the state is stored
   */
  constructor(file) {
    super();
    this.jsonStateFile = file;
  }

  /**
   * Loads the state from persistent storage.
   * @returns {Promise<import('./context').ExecutedMigration[]>}
   */
  async getJSON() {
    if (fse.existsSync(this.jsonStateFile)) {
      try {
        return require(this.jsonStateFile)
      } catch (e) {
        return []
      }
    }
    return []
  }

  /**
   * Saves the state to persistent storage.
   * @param {import('./context').ExecutedMigration[]} state
   */
  async saveJSON(state) {
    fse.outputJSONSync(this.jsonStateFile, state)
  }
};