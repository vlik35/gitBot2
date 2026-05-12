const { SlashCommandBuilder } = require('discord.js');
const { checkVoiceChannel } = require('../../utils/voiceChannelCheck.js');
const { checkCurrentTrack } = require('../../utils/playerValidation.js');
const { sendSuccessResponse, handleCommandError, safeDeferReply } = require('../../utils/responseHandler.js');
const { getLang } = require('../../utils/languageLoader');

const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Repeat the current track permanently');

module.exports = {
  data,
  run: async (client, interaction) => {
    try {
      const deferred = await safeDeferReply(interaction);
      if (!deferred && !interaction.deferred && !interaction.replied) return;

      const lang = await getLang(interaction.guildId).catch(() => ({ music: {} }));
      const t = lang.music?.loop || {};

      const player = client.riffy.players.get(interaction.guildId);
      const voiceCheck = await checkVoiceChannel(interaction, player);
      if (!voiceCheck.allowed) {
        const reply = await interaction.editReply({
          ...voiceCheck.response,
          fetchReply: true
        });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return reply;
      }

      const trackCheck = await checkCurrentTrack(player, null, interaction.guildId);
      if (!trackCheck.valid) {
        const reply = await interaction.editReply({
          ...trackCheck.response,
          fetchReply: true
        });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return reply;
      }

      if (player.loop === 'track') {
        return await sendSuccessResponse(
          interaction,
          t.alreadyActivated || '🔁 **¡El bucle de pista ya está activo!**'
        );
      }

      player.setLoop('track');

      return await sendSuccessResponse(
        interaction,
        t.trackLoopActivated || '🔁 **¡El bucle de pista está activado!**'
      );
    } catch (error) {
      const lang = await getLang(interaction.guildId).catch(() => ({ music: {} }));
      const t = lang.music?.loop?.errors || {};
      return await handleCommandError(
        interaction,
        error,
        'loop',
        (t.title || '## ❌ Error') + '\n\n' + (t.message || 'Ocurrió un error al activar el bucle de pista. Intenta de nuevo más tarde.')
      );
    }
  }
};
