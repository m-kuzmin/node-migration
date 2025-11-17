/**
 * The `Context` object that stores the 
 * @property {exports.State[]} state
 */
exports.Context = class {
    constructor() {
        /**
         * @type {exports.ExecutedMigration[]}
         */
        this.state = [];
    }

    /**
     * Loads the state from persistent storage.
     * @returns {Promise<exports.ExecutedMigration[]>}
     */
    async getJSON() {
        return [];
    }

    /**
     * Saves the state to persistent storage.
     * @param {exports.ExecutedMigration[]} _state
     */
    async saveJSON(_state) { }

    /**
     * Calls the `getJSON` method and assigns the return value to `state`
     */
    async _getState() {
        const json = await this.getJSON();
        this.state = json;
    }

    async _saveState() {
        if (this.state.length != 0) {
            await this.saveJSON(this.state)
        }
    }
}

/**
 * @property {number} id Migration timestamp as a number
 * @property {string} name Human readable name of the migration
 * @property {Date} date When this migration was performed
 */
exports.ExecutedMigration = class {
    /**
     * @param {number} id
     * @param {string} name
     * @param {Date} date When this migration was performed
     */
    constructor(id, name, date) {
        this.id = id;
        this.name = name;
        this.migratedOn = date;
    }
}