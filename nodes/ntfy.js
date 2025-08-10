/**
    * ntfy.js
    * Node-RED node for sending notifications via ntfy.sh
    */

module.exports = function (RED) {
    function encodeHeader(value) {
        // Only encode if non-ASCII is present
        return /[^\x00-\x7F]/.test(value)
            ? '=?UTF-8?B?' + Buffer.from(value, 'utf8').toString('base64') + '?='
            : value;
    }

    function NtfyNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.topic = config.topic;
        node.server = config.server || "https://ntfy.sh";
        node.title = config.title || "";
        node.tags = config.tags || "";
        node.priority = config.priority || "";

        node.on('input', function(msg) {
            const fetch = require('node-fetch'); // For node-fetch v2
            const topic = msg.ntfy_topic || node.topic;
            const server = msg.server || node.server;
            const title = msg.topic || node.title;
            const tags = msg.tags || node.tags;
            const priority = msg.priority || node.priority;
            const message = msg.payload;

            if (!topic || !message) {
                node.error("Topic and message (payload) are required.");
                return;
            }

            const url = `${server.replace(/\/$/, '')}/${encodeURIComponent(topic)}`;
            const headers = {
                'Content-Type': 'text/plain; charset=utf-8'
            };
            if (title) headers['Title'] = encodeHeader(title);
            if (tags) headers['Tags'] = encodeHeader(tags);
            if (priority) headers['Priority'] = priority;

            fetch(url, {
                method: 'POST',
                headers: headers,
                body: message
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Error sending to ntfy: ${res.statusText}`);
                }
                node.status({fill:"green",shape:"dot",text:"Sent"});
            })
            .catch(err => {
                node.status({fill:"red",shape:"ring",text:"Error"});
                node.error(err.message, msg);
            });
        });
    }
    RED.nodes.registerType("ntfy publish", NtfyNode);
}