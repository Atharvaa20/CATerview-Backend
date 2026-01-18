'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add upvotes column
        await queryInterface.addColumn('interview_experiences', 'upvotes', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        // Add upvoted_by column
        await queryInterface.addColumn('interview_experiences', 'upvoted_by', {
            type: Sequelize.JSONB,
            defaultValue: [],
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('interview_experiences', 'upvotes');
        await queryInterface.removeColumn('interview_experiences', 'upvoted_by');
    }
};
