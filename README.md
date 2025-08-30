# CrossBan

A Discord bot for ban-synchronization across multiple servers.

> [!IMPORTANT]
> This is not a public bot, but the source code is available for you to self-host.
> Please do not use this bot for malicious purposes.
>
> The license for this code is <license> - this means everyone is allowed to use it, but you are forbidden to make any money with it.

## Troubleshooting

### Database not found

The initialization script only gets created upon the first database startup. If the database is not found, try the following solutions:

#### Reinitialize the volume

> [!DANGER]
> This will delete all existing data in the database. So this is is only recommended for development environments, no other solutions work or there is not data yet.

1. Delete the database container of the database.
2. Delete the volume.
3. Restart the database container.

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0** - <https://polyformproject.org/licenses/noncommercial/1.0.0/>

This license allows you to use, modify, and distribute the code for noncommercial purposes, but you may not use it for commercial purposes or to make money.

---

Temp Notes:

### Unban Review Message:

```ts
import {
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";

const components = [
  new ContainerBuilder()
    .setAccentColor(41983)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Entbannung von <@1409909745250340924>\n-# **User ID:** `1409909745250340924`"),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            "https://cdn.discordapp.com/icons/1114825999155200101/3e8fb5ca5c7e2c1acd5727bbf9c8076c.webp",
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Unban Details**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>",
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL("https://cdn.discordapp.com/embed/avatars/0.png"))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Ban Summary**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>\n- **Reason:**\n  The reason is a very long text sometimes...",
          ),
        ),
    ),
  new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("9dc910a99315435190a7a00df15864fa")
      .setPlaceholder("Take Action!")
      .addOptions(
        new SelectMenuOptionBuilder().setLabel("Unban locally").setValue("f487c44975644e34a3ba771d45b8cfef").setEmoji({
          name: "📍",
        }),
        new SelectMenuOptionBuilder().setLabel("Ignore").setValue("4af3e581c2cb4823e351cba5cb6f9f21").setEmoji({
          name: "❎",
        }),
      ),
  ),
];
```

### Unban Success Message:

```ts
import {
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ContainerBuilder,
} from "discord.js";

const components = [
  new ContainerBuilder()
    .setAccentColor(3331645)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Entbannung von <@1409909745250340924>\n-# **User ID:** `1409909745250340924`"),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            "https://cdn.discordapp.com/icons/1114825999155200101/3e8fb5ca5c7e2c1acd5727bbf9c8076c.webp",
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Unban Details**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>",
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL("https://cdn.discordapp.com/embed/avatars/0.png"))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Ban Summary**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>\n- **Reason:**\n  The reason is a very long text sometimes...",
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Action Taken\n- **Action:** 🔨 Unbanned\n- **Executor:** <@506893652266844162>"),
    ),
];
```

### Unban Ignored Message:

```ts
import {
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ContainerBuilder,
} from "discord.js";

const components = [
  new ContainerBuilder()
    .setAccentColor(6429210)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Entbannung von <@1409909745250340924>\n-# **User ID:** `1409909745250340924`"),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            "https://cdn.discordapp.com/icons/1114825999155200101/3e8fb5ca5c7e2c1acd5727bbf9c8076c.webp",
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Unban Details**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>",
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL("https://cdn.discordapp.com/embed/avatars/0.png"))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Ban Summary**"),
          new TextDisplayBuilder().setContent(
            "- **Servername:** The servername\n- **Timestamp:** <t:1756494180:f>\n- **Executor:** <@506893652266844162>\n- **Reason:**\n  The reason is a very long text sometimes...",
          ),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Action Taken\n- **Action:** ❌ Ignored\n- **Executor:** <@506893652266844162>"),
    ),
];
```
