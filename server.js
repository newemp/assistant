const sessionHistory = {};  // Lưu context theo từng user


require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const { classifyMessage } = require("./utils.js");
const {
    agentQCMInfo,
    agentFile,
    agentURL,
    agentAudioFromFilePath,
    //agentSmallTalk
} = require("./agents.js");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== 1) WEBHOOK VERIFY (GET) =====
app.get("/webhook", (req, res) => {
    const token = process.env.VERIFY_TOKEN;

    if (req.query["hub.verify_token"] === token) {
        return res.send(req.query["hub.challenge"]);
    }

    res.send("Sai verify token");
});

// ===== 2) WEBHOOK RECEIVE MESSAGE (POST) =====
app.post("/webhook", async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const messaging = entry?.messaging?.[0];
        const senderId = messaging?.sender?.id;
        const message = messaging?.message?.text;
        
        
        /**/
        if (!sessionHistory[senderId]) {
            sessionHistory[senderId] = [];
        }


        // Lưu câu của user vào history
        sessionHistory[senderId].push({
            role: "user",
            content: message
        });



        // Giới hạn lịch sử tối đa 10 câu
        if (sessionHistory[senderId].length > 50) {
            sessionHistory[senderId].shift();
        }   /**/
        


        console.log("📩 Nhận từ user:", message);

        if (!message) return res.sendStatus(200);

        // PHÂN LOẠI TIN NHẮN
        const agent = classifyMessage(message);
        let reply = "Xin lỗi, tôi chưa hiểu yêu cầu.";

        // GỌI AGENT TƯƠNG ỨNG
        // if (agent === "qcm") reply = await agentQCMInfo(message);
        if (agent === "qcm") reply = await agentQCMInfo(message, sessionHistory[senderId]);
        else if (agent === "file") reply = await agentFile("./data/example.pdf");
        else if (agent === "url") reply = await agentURL("https://qcm.com.vn");
        else if (agent === "audio") reply = await agentAudioFromFilePath("./data/sample.wav");
        //else if (agent === "smalltalk") reply = await agentSmallTalk(message);

        // GỬI LẠI CHO USER
        await sendMessage(senderId, reply);
        sessionHistory[senderId].push({ role: "assistant", content: reply });

        

    } catch (e) {
        console.error("❌ Webhook Error:", e);
    }

    res.sendStatus(200);
});

// ===== 3) SEND MESSAGE BACK TO USER VIA MESSENGER API =====
/*
async function sendMessage(userId, text) {
    if (text.length > 1900) {
        text = text.substring(0, 1900) + "\n\n...[Nội dung dài đã được rút gọn]...";
    }
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/me/messages`,
            {
                recipient: { id: userId },
                message: { text }
            },
            {
                params: { access_token: process.env.PAGE_ACCESS_TOKEN } // SỬA LỖI Ở ĐÂY
            }
        );

        console.log("📤 Đã gửi:", text);
    } catch (err) {
        console.error("❌ Lỗi gửi Messenger:", err.response?.data || err);
    }
}
*/
//Chia đoạn text trả lời hơn 2000 từ thành các đoạn nhỏ
async function sendMessage(userId, text) {
    const limit = 1800; // chừa 200 ký tự để an toàn
    
    // Nếu text ngắn → gửi 1 tin
    if (text.length <= limit) {
        return sendChunk(userId, text);
    }

    // Nếu quá dài → chia thành nhiều phần
    const chunks = [];
    for (let i = 0; i < text.length; i += limit) {
        chunks.push(text.substring(i, i + limit));
    }

    // Gửi từng phần theo thứ tự
    for (const chunk of chunks) {
        await sendChunk(userId, chunk);
    }
}
async function sendChunk(userId, text) {
    try {
        await axios.post(
            "https://graph.facebook.com/v17.0/me/messages",
            {
                recipient: { id: userId },
                message: { text }
            },
            {
                params: { access_token: process.env.PAGE_ACCESS_TOKEN }
            }
        );
        console.log("📤 Sent chunk:", text.length);
    } catch (err) {
        console.error("❌ Lỗi gửi Messenger:", err.response?.data || err);
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 QCM Assistant đang chạy trên port 3000");
});
