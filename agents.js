const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { companyInfo } = require("./qcm_data.js");



async function agentSmallTalk(message) {
    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
Bạn là một trợ lý AI thân thiện. 
Hãy trả lời tự nhiên, vui vẻ, giống như người thật.
                `
            },
            {
                role: "user",
                content: message
            }
        ],
        temperature: 0.7
    });

    return completion.choices[0].message.content;
}

/*module.exports = {
    agentSmallTalk
};*/


/*
async function agentQCMInfo(userMessage) {
    const prompt = `
Bạn là trợ lý AI của công ty QCM. 
Bạn CHỈ được phép trả lời dựa trên dữ liệu sau đây. Không được tự bịa.

===== DỮ LIỆU QCM =====
${companyInfo}
===== HẾT =====

Khách hỏi: "${userMessage}"

Hãy trả lời chính xác, ngắn gọn, dễ hiểu.
Nếu câu hỏi không có trong dữ liệu, hãy trả lời:
"Thông tin này chưa có trong cơ sở dữ liệu QCM. Bạn có muốn tôi kết nối nhân viên hỗ trợ không?"
`;

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
    });

    return completion.choices[0].message.content;
}

module.exports = {
    agentQCMInfo,
};
*/


// Agent 1: Trả lời info công ty QCM





async function agentQCMInfo(userMessage, history = []) {

    const messages = [
        {
            role: "system",
            content: `
Bạn là một trợ lý AI thân thiện. 
Hãy trả lời tự nhiên, vui vẻ, hài hước, giống như người thật.
Tập trung vô dùng dữ liệu QCM bên dưới để trả lời.
Nếu không có trong dữ liệu → nói không có.
===== DỮ LIỆU QCM =====
${companyInfo}
===== HẾT =====
`
        }
    ];

    // thêm lịch sử hội thoại
    for (const h of history) {
        messages.push({
            role: h.role,
            content: h.content
        });
    }

    // Thêm câu hỏi mới
    messages.push({
        role: "user",
        content: userMessage
    });

    const completion = await client.chat.completions.create({
        model: "gpt-4.1-mini",//"gpt-4o-mini",
        messages,
        temperature: 0.2
    });

    return completion.choices[0].message.content;
}

/*
async function agentQCMInfo(message) {
    const prompt =
        `Bạn là trợ lý AI của công ty QCM.
        Trả lời ngắn gọn, lịch sự, tiếng Việt.
        ===== DỮ LIỆU QCM =====
        ${companyInfo}
        ============
        Trả lời dựa trên dữ liệu sau đây là chủ yếu.
        Câu hỏi của khách: ${message}`;

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
    });

    return completion.choices[0].message.content;
}
    */

module.exports = {
    agentQCMInfo,
};


const fs = require("fs");
const pdf = require("pdf-parse");


async function agentFile(filePath) {
    // 1. Đọc PDF
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    const content = data.text;

    // 2. Gửi nội dung PDF vào GPT (RAG inline PDF)
    const prompt = `
        Đây là nội dung tài liệu:

        ${content.substring(0, 12000)}

        Dựa trên tài liệu, hãy trả lời câu hỏi của người dùng.
        Nếu không thấy thông tin, trả lời "Không có trong tài liệu".
    `;

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
    });

    return completion.choices[0].message.content;
}


const axios = require("axios");

async function agentURL(url) {
    try {
        const res = await axios.get(url);
        const html = res.data;

        const cleaned = html.replace(/<[^>]*>?/gm, " ").slice(0, 8000);

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: `Dưới đây là nội dung website:\n${cleaned}\n\nHãy phân tích và trả lời câu hỏi của người dùng.`
            }]
        });

        return completion.choices[0].message.content;

    } catch (e) {
        return "Không thể đọc URL này.";
    }
}



async function agentAudioFromFilePath(path) {
    const audio = fs.readFileSync(path);

    const stt = await client.audio.transcriptions.create({
        file: audio,
        model: "whisper-1",
        language: "vi"
    });

    const text = stt.text;

    return `Bạn đã nói: ${text}`;
}


module.exports = {
    agentQCMInfo,
    agentFile,
    agentURL,
    agentAudioFromFilePath,
    //agentSmallTalk
};
