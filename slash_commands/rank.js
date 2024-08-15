const { SlashCommandBuilder } = require('@discordjs/builders');
const { createXpCard } = require('../assets/createXPCard');
const UserProfile = require('../models/UserProfile');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Muestra la tarjeta de rango de un usuario'),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // Obtener el perfil del usuario o crearlo si no existe
            const userProfile = await getUserProfile(userId, guildId);
            if (!userProfile) {
                return interaction.editReply('No se encontró un perfil para este usuario en este servidor.');
            }

            // Calcular la información de XP y rango
            const { xp, level, nextLevelXP, rank } = await calculateXpAndRank(userProfile, guildId);

            // Obtener la URL del avatar del usuario y su estado
            const avatarURL = interaction.user.displayAvatarURL({ format: 'png' });
            const userStatus = await getUserStatus(interaction);

            // Crear la imagen de rango
            const rankImageBuffer = await createXpCard(interaction.user.displayName, xp, level, nextLevelXP, rank, avatarURL, userStatus);
            const attachment = new AttachmentBuilder(rankImageBuffer, { name: 'rank.png' });

            // Enviar la respuesta con la imagen de rango
            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error('Error al generar la tarjeta de rango:', error);
            await interaction.editReply('Hubo un error al generar la tarjeta de rango.');
        }
    },
};

// Función para obtener el perfil del usuario o crearlo si no existe
async function getUserProfile(userId, guildId) {
    const userProfile = await UserProfile.findOne({ userId });

    if (userProfile) {
        const guildProfile = userProfile.levels.find(level => level.guildId === guildId);
        if (guildProfile) {
            return guildProfile;
        }
    }

    // Si no existe el perfil para este guild, crear uno nuevo
    if (!userProfile) {
        const newProfile = new UserProfile({
            userId,
            username: interaction.user.username,
            levels: [{ guildId, xp: 0, level: 1, messages: 1 }]
        });
        await newProfile.save();
        return newProfile.levels[0];
    }

    // Si el usuario existe pero no tiene perfil para este guild, agregar uno nuevo
    userProfile.levels.push({ guildId, xp: 0, level: 1, messages: 1 });
    await userProfile.save();
    return userProfile.levels[userProfile.levels.length - 1];
}

// Función para calcular la XP, el nivel y el rango del usuario
async function calculateXpAndRank(guildProfile, guildId) {
    const xp = guildProfile.xp;
    const level = guildProfile.level;
    const nextLevelXP = level * 100; // Ejemplo de fórmula para calcular la XP del siguiente nivel

    // Calcular el rango del usuario
    const rank = await UserProfile.countDocuments({
        'levels.guildId': guildId,
        'levels.xp': { $gt: xp }
    }) + 1;

    return { xp, level, nextLevelXP, rank };
}

// Función para obtener el estado del usuario
async function getUserStatus(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    return member.presence ? member.presence.status : 'offline';
}
