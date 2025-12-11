import axios from "axios";
import { classifyMessage } from "../utils.js";
import {
    agentQCMInfo,
    agentFile,
    agentURL,
    agentAudioFromFilePath,
} from "../agents.js";

// Session memory (simple)
const sessionHistory = {};

export default async function handler(req, res) {
    // ====== 1) VERIFY TOKEN ======
    if (req.method === "GET") {
        const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

        if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
            return res.status(200).send(req.query["hub.challenge"]);
        } else {
            return res.status(403).send("Sai verify token");
        }
    }

    // ====== 2) RECEIVE MESSAGE ======
    if (req.method === "POST") {
        try {
            const entry = req.body.entry?.[0];
            const messaging = entry?.messaging?.[0];
            const senderId = messaging?.sender?.id;
            const message = messaging?.message?.text;

            if (!message) return res.status(200).end();

            console.log("📩 User:", message);

            // Session history init
            if (!sessionHistory[senderId]) sessionHistory[senderId] = [];

            sessionHistory[senderId].push({ role: "user", content: message });

            const agent = classifyMessage(message);
            let reply = "Xin lỗi, tôi chưa hiểu yêu cầu.";

            if (agent === "qcm")
                reply = await agentQCMInfo(message, sessionHistory[senderId]);
            else if (agent === "file")
                reply = await agentFile("./data/example.pdf");
            else if (agent === "url")
                reply = await agentURL("https://qcm.com.vn");
            else if (agent === "audio")
                reply = await agentAudioFromFilePath("./data/sample.wav");

            // Save bot message
            sessionHistory[senderId].push({
                role: "assistant",
                content: reply,
            });

            await sendMessage(senderId, reply);

            return res.status(200).end();
        } catch (err) {
            console.error("❌ Webhook error:", err);
            return res.status(500).send("Lỗi server webhook");
        }
    }

    return res.status(405).send("Method not allowed");
}

// ====== 3) SEND MESSAGE TO MESSENGER ======
async function sendMessage(userId, text) {
    try {
        await axios.post(
            "https://graph.facebook.com/v17.0/me/messages",
            {
                recipient: { id: userId },
                message: { text },
            },
            {
                params: {
                    access_token: process.env.PAGE_ACCESS_TOKEN,
                },
            }
        );
    } catch (err) {
        console.error("❌ Send error:", err.response?.data);
    }
}
