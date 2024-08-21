const { SlashCommandBuilder } = require('@discordjs/builders');
const UserProfile = require('../models/UserProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removexp')
        .setDescription('Quitar XP a un usuario.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario al que quieres quitar XP')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('cantidad')
                .setDescription('Cantidad de XP a quitar')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const guildId = interaction.guild.id;
            const userId = interaction.options.getUser('usuario').id;
            const xpAmount = interaction.options.getInteger('cantidad');

            // Obtener el perfil del usuario
            const userProfile = await getUserProfile(guildId, userId);
            if (!userProfile) {
                return interaction.reply({
                    content: 'El usuario no tiene un perfil registrado.', 
                    ephemeral: true 
                });
            }

            // Quitar XP y asegurar que no sea negativo
            const updatedXp = removeXpFromUser(userProfile, xpAmount);
            await userProfile.save();

            // Responder al comando
            await interaction.reply({
                content: `Se han quitado ${xpAmount} XP a ${interaction.options.getUser('usuario').username}. (XP restante: ${updatedXp})`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error removing XP:', error);
            await interaction.reply({ 
                content: 'Hubo un error al ejecutar este comando.', 
                ephemeral: true 
            });
        }
    },
};

// Función para obtener el perfil del usuario
async function getUserProfile(guildId, userId) {
    return await UserProfile.findOne({ guildId, userId });
}

// Función para quitar XP al usuario y asegurarse de que no sea negativo
function removeXpFromUser(userProfile, xpAmount) {
    userProfile.xp = Math.max(userProfile.xp - xpAmount, 0);
    return userProfile.xp;
}
