const { SlashCommandBuilder } = require('@discordjs/builders');
const UserProfile = require('../models/UserProfile');
const LevelSettings = require('../models/LevelSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givexp')
        .setDescription('Dar XP a un usuario.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario al que quieres dar XP')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('cantidad')
                .setDescription('Cantidad de XP a dar')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const guildId = interaction.guild.id;
            const userId = interaction.options.getUser('usuario').id;
            const xpAmount = interaction.options.getInteger('cantidad');

            // Obtener o crear el perfil del usuario
            const userProfile = await getUserProfile(guildId, userId);

            // Añadir XP al usuario
            const leveledUp = addXpToUser(userProfile, xpAmount);

            await userProfile.save();

            // Notificar al usuario si subió de nivel
            if (leveledUp) {
                await notifyLevelUp(interaction, userProfile);
            }

            // Responder al comando
            await interaction.reply({
                content: `Se han dado ${xpAmount} XP a ${interaction.options.getUser('usuario').username} y ahora es de nivel ${userProfile.level}.`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error giving XP:', error);
            await interaction.reply({ 
                content: 'Hubo un error al ejecutar este comando.', 
                ephemeral: true 
            });
        }
    },
};


// Función para obtener o crear el perfil del usuario
async function getUserProfile(guildId, userId) {
    let userProfile = await UserProfile.findOne({ guildId, userId });
    if (!userProfile) {
        userProfile = new UserProfile({
            guildId,
            userId,
            xp: 0,
            level: 1,
        });
    }
    return userProfile;
}

// Función para añadir XP al usuario y verificar si sube de nivel
function addXpToUser(userProfile, xpAmount) {
    userProfile.xp += xpAmount;
    const xpToNextLevel = userProfile.level * 100; // Ejemplo de fórmula para subir de nivel

    if (userProfile.xp >= xpToNextLevel) {
        userProfile.level += 1;
        userProfile.xp -= xpToNextLevel;
        return true; // El usuario subió de nivel
    }

    return false; // El usuario no subió de nivel
}

// Función para notificar al usuario y al canal que subió de nivel
async function notifyLevelUp(interaction, userProfile) {
    await interaction.channel.send(`${interaction.options.getUser('usuario').username} ha subido al nivel ${userProfile.level}!`);
}
