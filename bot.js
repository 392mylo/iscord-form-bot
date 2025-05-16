const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const app = express();
app.use(bodyParser.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const WEBHOOK_CHANNEL_ID = '1373039177482109029'; // Channel to send application embeds

app.post('/submit', async (req, res) => {
  const { name, discordId, answers } = req.body;

  const embed = new EmbedBuilder()
    .setTitle('New Application Received')
    .setDescription(answers.map(a => `**${a.question}:** ${a.answer}`).join('\n'))
    .setColor('Blue')
    .setFooter({ text: `Applicant: ${name}` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${discordId}_${name}`)
      .setLabel('✅ Accept')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`deny_${discordId}_${name}`)
      .setLabel('❌ Deny')
      .setStyle(ButtonStyle.Danger)
  );

  try {
    const channel = await client.channels.fetch(WEBHOOK_CHANNEL_ID);
    await channel.send({ embeds: [embed], components: [buttons] });
    res.sendStatus(200);
  } catch (err) {
    console.error('Error sending to Discord:', err);
    res.sendStatus(500);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, discordId, name] = interaction.customId.split('_');
  const status = action === 'accept' ? 'accepted ✅' : 'denied ❌';

  const responseEmbed = new EmbedBuilder()
    .setTitle('Entry Application Reviewed!')
    .setDescription(`${name}'s application has been **${status}**`)
    .setColor(action === 'accept' ? 'Green' : 'Red');

  await interaction.update({ embeds: [responseEmbed], components: [] });

  try {
    const user = await client.users.fetch(discordId);
    await user.send(`Hello ${name}, your application was **${status}**`);
  } catch (e) {
    console.log(`Couldn't DM user ${discordId}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
client.login(process.env.TOKEN);
