const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  // Slash command
  if (interaction.isChatInputCommand() && interaction.commandName === 'member-log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Member Log')
      .setDescription('No content yet.')
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_member_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // Button click
  if (interaction.isButton() && interaction.customId === 'edit_member_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('member_log_modal')
      .setTitle('Edit Member Log');

    const currentText = interaction.message.embeds[0]?.description || '';

    const input = new TextInputBuilder()
      .setCustomId('log_content')
      .setLabel('Log Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter member log details here...')
      .setValue(currentText)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  // Modal submit
  if (interaction.isModalSubmit() && interaction.customId === 'member_log_modal') {
    const content = interaction.fields.getTextInputValue('log_content');

    const updatedEmbed = new EmbedBuilder()
      .setTitle('📋 Member Log')
      .setDescription(content)
      .setColor(0x5865F2)
      .setFooter({ text: `Last edited by ${interaction.user.username}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_member_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ embeds: [updatedEmbed], components: [row] });
  }
});

client.login(process.env.TOKEN);
