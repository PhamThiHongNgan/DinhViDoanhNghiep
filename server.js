import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// GEMINI AI CONFIGURATION
// ==========================================

// Read API key fresh each time (supports both local .env and Vercel env vars)
function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

// Lazy-init GenAI instance
let _genAI = null;
function getGenAI() {
  const key = getApiKey();
  if (!key || key.includes("your_gemini_api_key_here")) {
    return null;
  }
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

// Load system prompt (with fallback for serverless where file may not exist)
let systemPromptBase = "";
try {
  systemPromptBase = fs.readFileSync(path.resolve("system-prompt.txt"), "utf8");
  console.log("✅ Đã tải system-prompt.txt thành công.");
} catch (err) {
  console.warn("⚠️ Không tìm thấy system-prompt.txt, sử dụng prompt mặc định...");
  systemPromptBase = `Bạn là Trợ lý AI phân tích và định vị mô hình kinh doanh SME sắc bén, hoạt động dựa trên khung "Tư duy mô hình kinh doanh trong kỷ nguyên Số & AI".
Nhiệm vụ của bạn là dẫn dắt CEO qua buổi chat khảo sát định vị doanh nghiệp, tuân theo quy trình logic sau:
1. MỞ (Chào hỏi, hỏi tên doanh nghiệp, ngành nghề)
2. HIỂU DN (Tìm hiểu sản phẩm chủ lực, khách hàng mục tiêu)
3. TÌM TRIỆU CHỨNG (Hỏi điểm đau, khó khăn lớn nhất như doanh thu đi ngang, chi phí cao,...)
4. ĐÀO NGUYÊN NHÂN (Đi sâu vào chi tiết của triệu chứng. KHÔNG kết luận vội vàng.)
5. XÁC NHẬN ĐIỂM NGHẼN (Nhận diện điểm nghẽn cốt lõi ở phễu bán hàng, USP, hay vận hành và hỏi xem USP của họ là gì để so sánh)
6. TÌM TÀI SẢN (Hỏi xem doanh nghiệp đang có lợi thế, tài sản gì...)
7. TÌM CƠ HỘI (Hỏi xem họ thấy cơ hội gì mới...)
8. CHỐT ƯU TIÊN (Tổng kết ngắn gọn, đưa ra 1 việc cần làm ngay và chốt buổi chat)

Quy tắc ứng xử:
- Nói tiếng Việt chuyên nghiệp, ngắn gọn, đồng cảm nhưng thẳng thắn và sắc sảo như một chuyên gia tư vấn chiến lược.
- Mỗi lượt trả lời chỉ viết tối đa 3-4 câu và chỉ đặt đúng 1 câu hỏi trọng tâm nhất. Tránh hỏi dồn dập nhiều câu cùng lúc.
- Dựa trên lịch sử trò chuyện để xác định đang ở bước nào trong logic.
- Khi số lượt user chat đạt đến 8 hoặc 9, hãy chuyển sang bước "CHỐT ƯU TIÊN", tổng kết ngắn gọn, thông báo cho CEO rằng báo cáo phân tích chi tiết đã được lập xong và họ có thể nhấn nút xem ngay phía dưới. Không được hỏi thêm nữa.`;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Chatbot endpoint: GUIDES client through diagnostic logic using Gemini AI
app.post("/api/chat", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
  }

  const genAI = getGenAI();
  if (!genAI) {
    return res.status(503).json({ 
      error: "Hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập GEMINI_API_KEY." 
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const userMessagesCount = history.filter(m => m.role === "user").length;

    const systemPrompt = `${systemPromptBase}

- Hiện tại, buổi chat đang ở lượt thứ ${userMessagesCount + 1}/10. 

Lịch sử cuộc hội thoại:
${history.map(m => `${m.role === "user" ? "CEO" : "AI"}: ${m.content}`).join("\n")}
AI:`;

    console.log(`🤖 Generating AI chat response for turn ${userMessagesCount}...`);
    const result = await model.generateContent(systemPrompt);
    const replyText = result.response.text().trim();

    // Determine current stage based on user message count
    let stage = "MO";
    if (userMessagesCount >= 7) {
      stage = "COMPLETED";
    } else if (userMessagesCount >= 6) {
      stage = "CHOT_UU_TIEN";
    } else if (userMessagesCount >= 5) {
      stage = "CO_HOI";
    } else if (userMessagesCount >= 4) {
      stage = "TAI_SAN";
    } else if (userMessagesCount >= 3) {
      stage = "XAC_NHAN";
    } else if (userMessagesCount >= 2) {
      stage = "NGUYEN_NHAN";
    } else if (userMessagesCount >= 1) {
      stage = "TRIEU_CHUNG";
    } else {
      stage = "HIEU_DN";
    }

    console.log(`✅ AI response generated successfully (stage: ${stage})`);
    res.json({ reply: replyText, stage });
  } catch (error) {
    console.error("❌ Gemini Chat API Error:", error.message);
    res.status(500).json({ 
      error: `Lỗi kết nối AI: ${error.message}. Vui lòng thử lại sau.` 
    });
  }
});

// Report generation endpoint: Analyzes the chat history and outputs structured audit JSON using Gemini AI
app.post("/api/report", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
  }

  const genAI = getGenAI();
  if (!genAI) {
    return res.status(503).json({ 
      error: "Hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập GEMINI_API_KEY." 
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const conversationText = history
      .map(m => `${m.role === "user" ? "CEO" : "AI Chuyên Gia"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `Bạn là một AI Chuyên Gia phân tích và tái cấu trúc mô hình kinh doanh cho SME.
Nhiệm vụ của bạn là đọc kỹ cuộc trò chuyện khảo sát định vị giữa CEO doanh nghiệp và Trợ lý AI dưới đây. Sau đó, chấm điểm (từ 0 đến 100) và đưa ra phân tích sâu sắc cho 9 tiêu chí sau:
1. businessLevel (Cấp độ giá trị của mô hình kinh doanh: Cấp 1 Bán sản phẩm, Cấp 2 Bán giải pháp, Cấp 3 Tạo trải nghiệm, Cấp 4 Hệ sinh thái)
2. usp (Khác biệt cốt lõi & USP của sản phẩm)
3. customerInsight (Mức độ thấu hiểu khách hàng mục tiêu)
4. marketing (Mức độ tối ưu phễu marketing & đường dẫn giá trị)
5. revenue (Độ đa dạng của dòng tiền & giá trị vòng đời khách hàng)
6. scalability (Khả năng nhân rộng/mở rộng kinh doanh)
7. management (Tính tự vận hành & mức độ thoát ly của CEO)
8. data (Độ sẵn sàng dữ liệu tập trung & hạ tầng ứng dụng AI)
9. readiness (Mức độ sẵn sàng chuyển đổi số & ứng dụng AI tổng thể)

Hãy chấm điểm nghiêm túc, thẳng thắn, không nói tránh để làm đẹp số liệu. Với mỗi tiêu chí, hãy tìm ra:
- score: Điểm số từ 0 đến 100.
- evidence: Bằng chứng cụ thể trích ra hoặc suy luận từ câu trả lời của CEO.
- risk: Rủi ro thực tế nếu doanh nghiệp không thay đổi khía cạnh này.
- recommendation: Đề xuất hành động thiết thực, cụ thể, dễ thực thi cho doanh nghiệp (khoảng 15-25 từ).

Ngoài ra, cung cấp thêm:
- profile: Trích xuất thông tin sơ bộ của doanh nghiệp gồm tên (bizName), ngành nghề (industry), sản phẩm chủ lực (product), đối tượng khách hàng mục tiêu (targetCustomer), lợi thế/tài sản lớn nhất (assets), cơ hội bứt phá số/AI lớn nhất (opportunities).
- revenueHypotheses: Lập 3 câu giả thuyết tăng trưởng/doanh thu thực tế dựa trên điểm nghẽn của doanh nghiệp (Ví dụ: 'Nếu tối ưu tỷ lệ chốt sales thêm 10%...', 'Nếu chuẩn hóa dữ liệu...').
- businessDNA: Phân tích đặc trưng doanh nghiệp gồm phong cách (style), văn hóa vận hành (culture), phong cách ra quyết định của ban lãnh đạo (decisionMaking).
- executiveSummary: Nhận định điều hành tổng quan dài 3-4 câu phân tích sắc bén, chỉ ra điểm nghẽn chí tử nhất.
- roadmap: Lộ trình 30 ngày gồm 4 bước hành động (Tuần 1, Tuần 2, Tuần 3, Tuần 4) để giải quyết điểm nghẽn.
- topPriority: 1 việc cần làm NGAY LẬP TỨC trong tuần tới.

Yêu cầu trả về đúng định dạng JSON có cấu trúc sau:
{
  "items": {
    "businessLevel": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "usp": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "customerInsight": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "marketing": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "revenue": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "scalability": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "management": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "data": {"score": 0, "evidence": "", "risk": "", "recommendation": ""},
    "readiness": {"score": 0, "evidence": "", "risk": "", "recommendation": ""}
  },
  "profile": {
    "bizName": "",
    "industry": "",
    "product": "",
    "targetCustomer": "",
    "assets": "",
    "opportunities": ""
  },
  "revenueHypotheses": [
    "",
    "",
    ""
  ],
  "businessDNA": {
    "style": "",
    "culture": "",
    "decisionMaking": ""
  },
  "executiveSummary": "",
  "roadmap": [
    {"step": "Tuần 1", "action": ""},
    {"step": "Tuần 2", "action": ""},
    {"step": "Tuần 3", "action": ""},
    {"step": "Tuần 4", "action": ""}
  ],
  "topPriority": ""
}`;

    const userMsg = `Dưới đây là biên bản cuộc hội thoại chẩn đoán:
${conversationText}`;

    console.log("📊 Analyzing conversation to compile Business Diagnostic Report...");
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMsg }
    ]);

    const responseText = result.response.text();
    const cleanJsonText = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJsonText);

    console.log(`✅ Report generated successfully for: ${parsedData.profile?.bizName || "Unknown"}`);
    res.json(parsedData);
  } catch (error) {
    console.error("❌ Gemini Report Generation API Error:", error.message);
    res.status(500).json({ 
      error: `Lỗi tạo báo cáo từ AI: ${error.message}. Vui lòng thử lại sau.` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  const key = getApiKey();
  if (key && !key.includes("your_gemini_api_key_here")) {
    console.log("✅ Gemini API Key đã được cấu hình - Chế độ AI động.");
  } else {
    console.log("❌ Gemini API Key CHƯA được cấu hình - Server sẽ trả về lỗi.");
  }
});

export default app;
