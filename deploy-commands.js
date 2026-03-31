const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('member-log')
    .setDescription('Post an editable member log'),

  new SlashCommandBuilder()
    .setName('add-trigger')
    .setDescription('Add a trigger word and response')
    .addStringOption(option => option.setName('trigger').setDescription('The trigger word or phrase').setRequired(true))
    .addStringOption(option => option.setName('response').setDescription('The response to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove-trigger')
    .setDescription('Remove a trigger word')
    .addStringOption(option => option.setName('trigger').setDescription('The trigger word to remove').setRequired(true)),

  new SlashCommandBuilder()
    .setName('list-triggers')
    .setDescription('List all trigger words for this server'),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering global slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Global slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();
