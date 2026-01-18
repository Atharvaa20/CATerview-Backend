'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Using raw SQL because the custom simple-migrate.js runner only provides the .query() method
        console.log('Adding upvotes column...');
        await queryInterface.query('ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0 NOT NULL');

        console.log('Adding upvoted_by column...');
        await queryInterface.query('ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS upvoted_by JSONB DEFAULT \'[]\'::jsonb NOT NULL');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.query('ALTER TABLE interview_experiences DROP COLUMN IF EXISTS upvotes');
        await queryInterface.query('ALTER TABLE interview_experiences DROP COLUMN IF EXISTS upvoted_by');
    }
};
