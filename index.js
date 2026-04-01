const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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

    stickyMessages[sent.id] = {
      channelId: interaction.channelId,
      title: '📌 Sticky Log',
      content: 'No content yet.'
    };
  }

  // Button: edit_member_log
  if (interaction.isButton() && interaction.customId === 'edit_member_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const messageId = interaction.message.id;
    const currentTitle = interaction.message.embeds[0]?.title || 'Recently Joined Members';
    const currentText = interaction.message.embeds[0]?.description || '';

    const modal = new ModalBuilder()
      .setCustomId(`member_log_modal:${messageId}`)
      .setTitle('Edit Member Log');

    const titleInput = new TextInputBuilder()
      .setCustomId('member_log_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter title here...')
      .setValue(currentTitle)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId('log_content')
      .setLabel('Log Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter member log details here...')
      .setValue(currentText)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(contentInput)
    );

    await interaction.showModal(modal);
  }

  // Button: edit_sticky_log
  if (interaction.isButton() && interaction.customId === 'edit_sticky_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const messageId = interaction.message.id;
    const currentTitle = interaction.message.embeds[0]?.title || '📌 Sticky Log';
    const currentText = interaction.message.embeds[0]?.description || '';

    const modal = new ModalBuilder()
      .setCustomId(`sticky_log_modal:${messageId}`)
      .setTitle('Edit Sticky Log');

    const titleInput = new TextInputBuilder()
      .setCustomId('sticky_log_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter title here...')
      .setValue(currentTitle)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId('sticky_log_content')
      .setLabel('Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter sticky log details here...')
      .setValue(currentText)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(contentInput)
    );

    await interaction.showModal(modal);
  }

  // Modal: member_log_modal
  if (interaction.isModalSubmit() && interaction.customId.startsWith('member_log_modal:')) {
    const title = interaction.fields.getTextInputValue('member_log_title');
    const content = interaction.fields.getTextInputValue('log_content');

    const updatedEmbed = new EmbedBuilder()
      .setTitle(title)
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
  if (interaction.isModalSubmit() && interaction.customId.startsWith('sticky_log_modal:')) {
    const originalMessageId = interaction.customId.split(':')[1];
    const title = interaction.fields.getTextInputValue('sticky_log_title');
    const content = interaction.fields.getTextInputValue('sticky_log_content');
    const channelId = interaction.channelId;

    if (stickyMessages[originalMessageId]) {
      try {
        const oldMsg = await interaction.channel.messages.fetch(originalMessageId);
        await oldMsg.delete();
      } catch (e) {}
      delete stickyMessages[originalMessageId];
    }

    await interaction.deferUpdate();

    const updatedEmbed = new EmbedBuilder()
      .setTitle(title)
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

    stickyMessages[newMsg.id] = {
      channelId,
      title,
      content
    };
  }

});

// Sticky behavior: move to bottom on new message
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const channelId = message.channelId;

  const channelStickies = Object.entries(stickyMessages).filter(
    ([, data]) => data.channelId === channelId
  );

  if (channelStickies.length === 0) return;

  for (const [msgId, sticky] of channelStickies) {
    if (msgId === message.channel.lastMessageId) continue;

    try {
      const oldMsg = await message.channel.messages.fetch(msgId);
      await oldMsg.delete();
    } catch (e) {
      delete stickyMessages[msgId];
      continue;
    }

    const embed = new EmbedBuilder()
      .setTitle(sticky.title)
      .setDescription(sticky.content)
      .setColor(0xED4245);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const newMsg = await message.channel.send({ embeds: [embed], components: [row] });

    delete stickyMessages[msgId];
    stickyMessages[newMsg.id] = {
      channelId,
      title: sticky.title,
      content: sticky.content
    };
  }
});

client.login(process.env.TOKEN);
