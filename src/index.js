const { Webhook } = require('./discord');

function getEnv(name) {
    const value = process.env[name];
    if (!value || value === '')
        return null;
    return value;
}

function applySetting(webhook, func, name) {
    const value = getEnv(name);
    if (value) {
        webhook[func](value);
    }
}

class EmbedBuilder {
    constructor() {
        this.embed = {
            description: undefined,
            fields: [],
            author: {},
            footer: {},
            image: {},
            thumbnail: {},
            timestamp: undefined,
            title: undefined,
            url: undefined,
            color: undefined,
        };
        this.changed = false;
    }

    setDescription(description) {
        this.embed.description = description;
        this.changed = true;
    }
    
    setTitle(title) {
        this.embed.title = title;
        this.changed = true;
    }

    setURL(url) {
        this.embed.url = url;
        this.changed = true;
    }

    setColor(color) {
        if (color.startsWith('#')) {
            color = parseInt(color.slice(1), 16);
        } else {
            color = parseInt(color);
        }
        this.embed.color = color;
        this.changed = true;
    }

    setTimestamp(timestamp) {
        if (timestamp === 'now') {
            this.embed.timestamp = new Date().toISOString();
        } else if (timestamp === 'today') {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            this.embed.timestamp = date.toISOString();
        } else {
            const parsed = parseInt(timestamp);
            this.embed.timestamp = new Date(parsed).toISOString();
        }
        this.changed = true;
    }

    setFooterText(text) {
        this.embed.footer.text = text;
        this.changed = true;
    }

    setFooterIcon(icon) {
        this.embed.footer.icon_url = icon;
        this.changed = true;
    }

    setAuthorName(name) {
        this.embed.author.name = name;
        this.changed = true;
    }

    setAuthorIcon(icon) {
        this.embed.author.icon_url = icon;
        this.changed = true;
    }

    setAuthorURL(url) {
        this.embed.author.url = url;
        this.changed = true;
    }

    setImage(url) {
        this.embed.image.url = url;
        this.changed = true;
    }

    setThumbnail(url) {
        this.embed.thumbnail.url = url;
        this.changed = true;
    }

    addFields(keyvalues) {
        const lines = keyvalues.trim().split('\n');
        for (const line of lines) {
            const [name, value] = line.split('=');
            this.embed.fields.push({ name, value });
        }
        this.changed = true;
    }
}

function buildEmbed() {
    const builder = new EmbedBuilder();

    applySetting(builder, 'setTitle', 'EMBED_TITLE');
    applySetting(builder, 'setDescription', 'EMBED_DESCRIPTION');
    applySetting(builder, 'setURL', 'EMBED_URL');
    applySetting(builder, 'setAuthorName', 'EMBED_AUTHOR');
    applySetting(builder, 'setAuthorIcon', 'EMBED_AUTHOR_ICON');
    applySetting(builder, 'setColor', 'EMBED_COLOR');
    applySetting(builder, 'addFields', 'EMBED_FIELDS');
    applySetting(builder, 'setImage', 'EMBED_IMAGE');
    applySetting(builder, 'setThumbnail', 'EMBED_THUMBNAIL');
    applySetting(builder, 'setFooterText', 'EMBED_FOOTER');
    applySetting(builder, 'setFooterIcon', 'EMBED_FOOTER_ICON');
    applySetting(builder, 'setTimestamp', 'EMBED_TIMESTAMP');

    return builder.changed ? builder.embed : null;
}

async function main() {
    const webhookURL = process.env.WEBHOOK_URL;
    const content = process.env.CONTENT.trim();
    const debugPrint = process.env.DEBUG_PRINT === 'true';
    const filesPatterns = getEnv('FILES');
    const files = [];

    if (filesPatterns) {
        const glob = require('glob');
        const patterns = filesPatterns.split('\n');
        for (const pattern of patterns) {
            const filesFound = glob.sync(pattern);
            files.push(...filesFound);
        }
    }

    const webhook = new Webhook({
        url: webhookURL,
        throwErrors: true,
        debugPrint,
    });

    applySetting(webhook, 'setUsername', 'AUTHOR');
    applySetting(webhook, 'setAvatar', 'AVATAR');
    
    const embed = buildEmbed();
    if (embed) {
        webhook.addEmbed(embed);
    }

    for (const file of files) {
        webhook.addFile(file);
    }

    try {
        await webhook.send(content);
    } catch (err) {
        console.error(err);
        process.exit(0);
    }
}

main();