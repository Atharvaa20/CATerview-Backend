'use strict';

module.exports = {
    up: async (migrationUtils, Sequelize) => {
        // Using migrationUtils.sequelize.query to be consistent with existing migrations
        console.log('Adding upvotes column...');
        await migrationUtils.sequelize.query('ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0 NOT NULL');

        console.log('Adding upvoted_by column...');
        await migrationUtils.sequelize.query('ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS upvoted_by JSONB DEFAULT \'[]\'::jsonb NOT NULL');
    },

    down: async (migrationUtils, Sequelize) => {
        await migrationUtils.sequelize.query('ALTER TABLE interview_experiences DROP COLUMN IF EXISTS upvotes');
        await migrationUtils.sequelize.query('ALTER TABLE interview_experiences DROP COLUMN IF EXISTS upvoted_by');
    }
};
