const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Store sticky message info: { channelId: { messageId, content } }
const stickyMessages = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  // /member-log command
  if (interaction.isChatInputCommand() && interaction.commandName === 'member-log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Recently Joined Members')
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

  // /sticky-log command
  if (interaction.isChatInputCommand() && interaction.commandName === 'sticky-log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📌 Sticky Log')
      .setDescription('No content yet.')
      .setColor(0xED4245);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const sent = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    stickyMessages[interaction.channelId] = {
      messageId: sent.id,
      content: 'No content yet.'
    };
  }

  // Button: edit_member_log
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

  // Button: edit_sticky_log
  if (interaction.isButton() && interaction.customId === 'edit_sticky_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('sticky_log_modal')
      .setTitle('Edit Sticky Log');

    const currentText = interaction.message.embeds[0]?.description || '';

    const input = new TextInputBuilder()
      .setCustomId('sticky_log_content')
      .setLabel('Sticky Log Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter sticky log details here...')
      .setValue(currentText)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  // Modal: member_log_modal
  if (interaction.isModalSubmit() && interaction.customId === 'member_log_modal') {
    const content = interaction.fields.getTextInputValue('log_content');

    const updatedEmbed = new EmbedBuilder()
      .setTitle('Recently Joined Members')
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

  // Modal: sticky_log_modal
  if (interaction.isModalSubmit() && interaction.customId === 'sticky_log_modal') {
    const content = interaction.fields.getTextInputValue('sticky_log_content');
    const channelId = interaction.channelId;

    // Delete old sticky message
    if (stickyMessages[channelId]) {
      try {
        const oldMsg = await interaction.channel.messages.fetch(stickyMessages[channelId].messageId);
        await oldMsg.delete();
      } catch (e) {
        // Message might already be deleted, ignore
      }
    }

    await interaction.deferUpdate();

    const updatedEmbed = new EmbedBuilder()
      .setTitle('📌 Sticky Log')
      .setDescription(content)
      .setColor(0xED4245)
      .setFooter({ text: `Last edited by ${interaction.user.username}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const newMsg = await interaction.channel.send({ embeds: [updatedEmbed], components: [row] });

    stickyMessages[channelId] = {
      messageId: newMsg.id,
      content: content
    };
  }

});

// Sticky behavior: when someone sends a message, move sticky to bottom
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const channelId = message.channelId;
  if (!stickyMessages[channelId]) return;

  const sticky = stickyMessages[channelId];

  // Delete old sticky
  try {
    const oldMsg = await message.channel.messages.fetch(sticky.messageId);
    await oldMsg.delete();
  } catch (e) {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📌 Sticky Log')
    .setDescription(sticky.content)
    .setColor(0xED4245);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('edit_sticky_log')
      .setLabel('Edit')
      .setStyle(ButtonStyle.Primary)
  );

  const newMsg = await message.channel.send({ embeds: [embed], components: [row] });
  stickyMessages[channelId].messageId = newMsg.id;
});

client.login(process.env.TOKEN);
