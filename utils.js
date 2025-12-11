/*function classifyMessage(msg) {
    msg = msg.toLowerCase();

    if (msg.includes("giá") || msg.includes("sản phẩm") || msg.includes("bảo hành") || msg.includes("qcm")) {
        return "qcm";
    }

    if (msg.includes("file") || msg.includes("pdf") || msg.includes("word")) {
        return "file";
    }

    if (msg.includes("url") || msg.includes("link")) {
        return "url";
    }

    if (msg.includes("audio") || msg.includes("ghi âm")) {
        return "audio";
    }


}

module.exports = { classifyMessage };
*/


function classifyMessage(msg) {
    msg = msg.toLowerCase();

    // nhóm QCM
    /*
    if (
        msg.includes("giá") ||
        msg.includes("sản phẩm") ||
        msg.includes("bảo hành") ||
        msg.includes("qcm") ||
        msg.includes("cửa") ||
        msg.includes("cân") ||
        msg.includes("địa chỉ") ||
        msg.includes("liên hệ") ||
        msg.includes("hỗ trợ")
    ) {
        return "qcm";
    }*/ 
    
    // nhóm file
    if (msg.includes("file") || msg.includes("pdf") || msg.includes("word")) {
        return "file";
    }

    // nhóm url
    if (msg.includes("url") || msg.includes("link")) {
        return "url";
    }

    // nhóm audio
    if (msg.includes("audio") || msg.includes("ghi âm")) {
        return "audio";
    }

    // MẶC ĐỊNH → SMALLTALK GPT
    //return "smalltalk";
    return "qcm";
}

module.exports = { classifyMessage };

