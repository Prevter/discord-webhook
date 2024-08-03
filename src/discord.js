const fs = require('fs');
const { blob } = require('node:stream/consumers');
const path = require('path');

class Webhook {
    constructor(options) {
        this.options = options;
        this.values = {};
        this.files = [];
    }

    setUsername(username) {
        this.values.username = username;
    }

    setAvatar(avatar) {
        this.values.avatar_url = avatar;
    }

    addFile(file) {
        this.files.push(file);
    }

    addEmbed(embed) {
        this.values.embeds = [embed];
    }

    async buildFormData(content) {
        const formData = new FormData();

        this.values.content = content;
        formData.append('payload_json', JSON.stringify(this.values));
        
        for (const file of this.files) {
            formData.append(
                'upload-file', 
                await blob(fs.createReadStream(file)),
                path.basename(file),
            );
        }

        return formData;
    }

    async send(content) {
        const formData = await this.buildFormData(content);

        if (this.options.debugPrint) {
            console.log('Sending webhook:');
            console.log(this.values); 
        }

        const res = await fetch(this.options.url, {
            method: 'POST',
            body: formData,
            headers: { 'Host': 'discord.com', },
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to send webhook: ${text}`);
        }

        return res;
    }
}

module.exports = { Webhook };