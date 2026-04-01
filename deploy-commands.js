const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('member-log')
    .setDescription('Post an editable member log'),
  new SlashCommandBuilder()
    .setName('sticky-log')
    .setDescription('Post a sticky editable log (always moves to bottom)')
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
