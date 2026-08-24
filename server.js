import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// GEMINI AI CONFIGURATION (for Report only)
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

// ==========================================
// STATIC CHATBOT QUESTIONS (Fixed Script)
// ==========================================
const CHAT_STEPS = {
  0: {
    stage: "MO",
    reply: "Chào anh/chị! Tôi là Trợ lý AI phân tích và định vị mô hình kinh doanh SME. Hôm nay tôi sẽ đồng hành cùng anh/chị để rà soát, đánh giá mô hình và phát hiện các điểm nghẽn chiến lược.\n\nĐể bắt đầu, xin anh/chị chia sẻ **Tên doanh nghiệp** và **Ngành nghề/Lĩnh vực hoạt động chính** nhé.",
  },
  1: {
    stage: "HIEU_DN",
    reply: "Dạ đã ghi nhận. Tiếp theo, sản phẩm/dịch vụ **chủ lực** mang lại doanh thu chính của mình là gì? Và đối tượng **khách hàng mục tiêu** lớn nhất anh/chị đang phục vụ là ai?",
  },
  2: {
    stage: "TRIEU_CHUNG",
    reply: "Dạ tôi đã hiểu qua mô hình. Hiện tại, **triệu chứng khó khăn** lớn nhất khiến anh/chị trăn trở là gì? (Ví dụ: doanh thu dậm chân tại chỗ, chi phí vận hành quá cao, quảng cáo không hiệu quả, hay bản thân anh/chị đang bị quá tải quyết định mọi việc...)",
  },
  3: {
    stage: "NGUYEN_NHAN",
    reply: "Cảm ơn anh/chị đã chia sẻ thẳng thắn. Để tìm đúng nguyên nhân gốc rễ, tôi muốn đi sâu hơn một chút:\n\nVấn đề này thường do một vài nguyên nhân chính dưới đây. Đối với doanh nghiệp mình, anh/chị thấy do đâu nhiều nhất:\n- Ít khách hàng mới tiếp cận được thương hiệu?\n- Khách biết đến nhưng tỷ lệ chuyển đổi/chốt đơn thấp?\n- Giá trị đơn hàng nhỏ và khách cũ ít quay lại?\n- Hay do sản phẩm đã bị bão hòa và đối thủ cạnh tranh giá rẻ xuất hiện?",
  },
  4: {
    stage: "XAC_NHAN",
    reply: "Tôi hiểu rồi. Như vậy có vẻ điểm nghẽn đang nằm ở khâu tối ưu phễu hoặc định vị sản phẩm chưa đủ sắc bén. \n\nAnh/chị tự đánh giá **Khác biệt cốt lõi (USP)** của sản phẩm mình so với đối thủ trực tiếp đang ở mức nào? Khách hàng có dễ dàng nhận ra lý do vì sao họ phải mua của anh/chị thay vì bên khác không?",
  },
  5: {
    stage: "TAI_SAN",
    reply: "Cảm ơn anh/chị. Vậy hiện tại doanh nghiệp đang có **tài sản** hoặc **lợi thế** nào tốt nhất mà anh/chị tự tin có thể tận dụng để bứt phá? (Ví dụ: tệp khách hàng cũ rất trung thành, sản phẩm chất lượng vượt trội, đội ngũ nhân sự thiện chiến, hay mối quan hệ phân phối độc quyền...)",
  },
  6: {
    stage: "CO_HOI",
    reply: "Rất tuyệt vời, đó là bệ đỡ rất tốt. Trong kỷ nguyên Số & AI này, anh/chị có đang nhìn thấy **cơ hội** hay **thử nghiệm mới** nào muốn triển khai không? (Ví dụ: đưa sản phẩm lên thương mại điện tử/TikTok, áp dụng AI chăm sóc khách hàng tự động, hay đóng gói quy trình để nhượng quyền...)",
  },
  7: {
    stage: "CHOT_UU_TIEN",
    reply: "Cảm ơn anh/chị rất nhiều! Chúng ta đã đi qua đủ bức tranh khảo sát từ hiện trạng, điểm nghẽn, nguyên nhân, lợi thế đến cơ hội phát triển. Tôi đã ghi nhận toàn bộ thông tin.\n\nBây giờ tôi đang lập báo cáo phân tích định vị chi tiết cùng lộ trình hành động 30 ngày cho doanh nghiệp của anh/chị. Anh/chị hãy nhấn nút **'Xem kết quả định vị'** ngay dưới đây để xem chi tiết nhé!",
  }
};

// Return chatbot message based on number of user messages in history
function handleChat(history) {
  const userMessages = history.filter(m => m.role === "user");
  const turn = userMessages.length;
  
  if (turn >= 7) {
    return {
      reply: CHAT_STEPS[7].reply,
      stage: "COMPLETED"
    };
  }

  const response = CHAT_STEPS[turn];
  return {
    reply: response.reply,
    stage: response.stage
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Chatbot endpoint: Uses fixed script questions
app.post("/api/chat", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
  }

  console.log(`💬 Chat request - Turn: ${history.filter(m => m.role === "user").length}`);
  const result = handleChat(history);
  res.json(result);
});

// Report generation endpoint: Uses Gemini AI to analyze conversation and generate dynamic report
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

    console.log("📊 Analyzing conversation with Gemini AI to compile Business Diagnostic Report...");
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
    console.log("✅ Gemini API Key đã được cấu hình - Báo cáo sẽ dùng AI động.");
  } else {
    console.log("⚠️  Gemini API Key CHƯA cấu hình - Báo cáo phân tích sẽ không hoạt động.");
  }
  console.log("💬 Chat phỏng vấn: Câu hỏi tĩnh cố định (không cần API).");
});

export default app;
