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
// LOCAL FALLBACK CHATBOT LOGIC (No API Key)
// ==========================================
const FALLBACK_STEPS = {
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

// Return fallback chatbot message based on number of user messages in history
function handleLocalChat(history) {
  // Filter only user messages to count progress
  const userMessages = history.filter(m => m.role === "user");
  const turn = userMessages.length;
  
  if (turn >= 7) {
    return {
      reply: FALLBACK_STEPS[7].reply,
      stage: "COMPLETED"
    };
  }

  const response = FALLBACK_STEPS[turn];
  return {
    reply: response.reply,
    stage: response.stage
  };
}

// Generate heuristic analysis report from conversation history if API key is not configured
function generateLocalReport(history) {
  const fullText = history.map(m => m.content).join(" ").toLowerCase();
  
  // Heuristics based on text search
  let revenueScore = 60;
  let marketingScore = 55;
  let managementScore = 58;
  let dataScore = 30;
  let uspScore = 50;
  let customerScore = 65;
  let scalabilityScore = 45;
  let businessLevelScore = 40; // Default level 2 (Solution)

  if (fullText.includes("doanh thu") || fullText.includes("không tăng") || fullText.includes("giảm")) {
    revenueScore = 35;
  }
  if (fullText.includes("ads") || fullText.includes("quảng cáo") || fullText.includes("marketing") || fullText.includes("tìm khách")) {
    marketingScore = 30;
  }
  if (fullText.includes("quá tải") || fullText.includes("thủ công") || fullText.includes("ceo") || fullText.includes("rối")) {
    managementScore = 35;
  }
  if (fullText.includes("excel") || fullText.includes("zalo") || fullText.includes("phân tán") || fullText.includes("dữ liệu")) {
    dataScore = 20;
  }
  if (fullText.includes("giá rẻ") || fullText.includes("cạnh tranh") || fullText.includes("không khác biệt") || fullText.includes("usp")) {
    uspScore = 35;
  }
  if (fullText.includes("mở rộng") || fullText.includes("quy mô") || fullText.includes("phình to")) {
    scalabilityScore = 30;
  }

  const items = {
    businessLevel: {
      score: businessLevelScore,
      evidence: "Doanh nghiệp chủ yếu tập trung bán sản phẩm/giải pháp đơn lẻ, chưa thiết lập hệ sinh thái.",
      risk: "Dễ bị cuốn vào cuộc chiến cạnh tranh về giá và phụ thuộc giao dịch ngắn hạn.",
      recommendation: "Xây dựng thêm các sản phẩm phụ trợ và đóng gói dịch vụ thành giải pháp trọn gói để tăng lòng tin."
    },
    usp: {
      score: uspScore,
      evidence: uspScore < 40 ? "USP chưa rõ nét, khách hàng chủ yếu so sánh giá." : "Đã có lợi thế cạnh tranh nhưng chưa truyền thông đồng bộ.",
      risk: "Khách hàng dễ rời đi khi có đối thủ bán rẻ hơn 5-10%.",
      recommendation: "Xác định rõ 1 thuộc tính duy nhất mà đối thủ không thể bắt chước trong 6 tháng tới."
    },
    customerInsight: {
      score: customerScore,
      evidence: "Hiểu khách hàng ở mức độ cơ bản nhưng chưa cá nhân hóa bằng dữ liệu số.",
      risk: "Dễ bỏ sót các nhóm khách hàng tiềm năng có biên lợi nhuận cao.",
      recommendation: "Phân loại tệp khách hàng theo giá trị vòng đời (RFM) để chăm sóc chuyên biệt."
    },
    marketing: {
      score: marketingScore,
      evidence: marketingScore < 40 ? "Đang phụ thuộc vào quảng cáo trả phí ngắn hạn, thiếu phễu chuyển đổi lâu dài." : "Đã có phễu bán hàng cơ bản nhưng tỷ lệ chốt đơn còn chưa tối ưu.",
      risk: "Chi phí marketing (CAC) ngày càng tăng ăn mòn lợi nhuận.",
      recommendation: "Thiết lập hệ thống mồi dẫn (lead magnet) để thu thập thông tin khách hàng trước khi bán hàng trực tiếp."
    },
    revenue: {
      score: revenueScore,
      evidence: revenueScore < 40 ? "Doanh thu đi ngang hoặc phụ thuộc nặng vào nhóm khách cũ hoặc một sản phẩm duy nhất." : "Dòng tiền tương đối ổn định nhưng chưa có sự đột phá.",
      risk: "Doanh nghiệp dễ gặp khủng hoảng dòng tiền nếu sản phẩm chủ lực hoặc khách hàng lớn gặp sự cố.",
      recommendation: "Đa dạng hóa dòng tiền bằng cách thiết kế gói sản phẩm dạng đăng ký thành viên hoặc phí duy trì định kỳ."
    },
    scalability: {
      score: scalabilityScore,
      evidence: scalabilityScore < 40 ? "Quy trình vận hành phụ thuộc vào con người, khó chuyển giao khi nhân sự nghỉ việc." : "Đã có quy trình cơ bản nhưng chưa số hóa toàn bộ.",
      risk: "Càng mở rộng quy mô, chi phí cố định càng phình to và khó quản lý chất lượng đồng đều.",
      recommendation: "Viết quy trình chuẩn (SOP) cho 3 bộ phận quan trọng nhất: Sales, Chăm sóc khách hàng và Vận hành."
    },
    management: {
      score: managementScore,
      evidence: managementScore < 40 ? "CEO là nút thắt cổ chai, phải phê duyệt mọi quyết định nhỏ nhặt." : "Ban lãnh đạo đã phân quyền nhưng chưa có hệ thống báo cáo tự động.",
      risk: "CEO không có thời gian tập trung vào việc hoạch định chiến lược phát triển.",
      recommendation: "Xây dựng bảng điều khiển chỉ số (Dashboard) vận hành tuần để theo dõi hiệu suất từ xa."
    },
    data: {
      score: dataScore,
      evidence: dataScore < 30 ? "Dữ liệu khách hàng nằm rải rác trên Zalo, Excel cá nhân của từng nhân viên." : "Đã có phần mềm CRM/ERP nhưng dữ liệu chưa được khai thác triệt để.",
      risk: "Mất thông tin khách hàng khi nhân sự nghỉ việc, không thể áp dụng các giải pháp AI tự động hóa chăm sóc khách hàng.",
      recommendation: "Tập trung toàn bộ dữ liệu thông tin khách hàng và lịch sử mua hàng về một file/CRM chung ngay lập tức."
    },
    readiness: {
      score: dataScore + 10 > 100 ? 100 : dataScore + 10,
      evidence: "Chưa tích hợp công cụ tự động hóa toàn diện, nhưng ban lãnh đạo đã có nhận thức và sẵn sàng thử nghiệm số.",
      risk: "Quy trình chuyển đổi số dễ đi vào ngõ cụt nếu thiếu chuẩn hóa dữ liệu nền tảng trước khi mua phần mềm.",
      recommendation: "Xây dựng lộ trình đào tạo nhận thức số cho nhân viên và chọn 1 phòng ban làm thí điểm chuyển đổi trước."
    }
  };

  const profile = {
    bizName: history.find(m => m.role === "user" && m.content.length < 50)?.content.split("\n")[0] || "Doanh nghiệp khảo sát",
    industry: "Dịch vụ / Thương mại",
    product: "Sản phẩm & Dịch vụ chủ lực",
    targetCustomer: "Khách hàng đại chúng & Đối tác phân phối",
    assets: "Tệp khách hàng cũ trung thành, sản phẩm chất lượng ổn định, nhân sự nhiệt huyết",
    opportunities: "Số hóa phễu tiếp cận tự động, ứng dụng AI hỗ trợ CSKH và tối ưu quy trình làm việc"
  };

  const revenueHypotheses = [
    "Nếu chuẩn hóa dữ liệu khách hàng cũ, doanh nghiệp có thể tăng 15-20% doanh thu thông qua việc tối ưu tần suất mua lại và bán chéo tự động.",
    "Bằng cách làm sắc bén USP và đồng bộ kênh marketing, chi phí CAC có thể giảm 25-30%, giúp cải thiện đáng kể biên lợi nhuận ròng.",
    "Nếu số hóa quy trình và tự động hóa khâu chuyển lead, thời gian xử lý đơn hàng sẽ giảm một nửa, tăng 10-15% tỷ lệ chốt sales."
  ];

  const businessDNA = {
    style: "Tập trung vào sản phẩm/kỹ thuật (Product-centric)",
    culture: "Thích ứng linh hoạt, hành động nhanh nhưng thiếu kỷ luật quy trình",
    decisionMaking: "Mọi quyết định lớn nhỏ đều đi qua CEO, dựa trên trải nghiệm cảm xúc cá nhân thay vì dữ liệu số chứng minh."
  };

  return {
    items,
    profile,
    revenueHypotheses,
    businessDNA,
    executiveSummary: "⚠️ Báo cáo được tạo dưới dạng mô phỏng dự phòng (chưa cấu hình GEMINI_API_KEY). Nhìn chung, doanh nghiệp đang gặp điểm nghẽn ở khâu chuyển hóa dữ liệu số và xây dựng phễu khách hàng tự động. Hệ thống vận hành còn phụ thuộc nặng vào CEO, cản trở việc nhân bản.",
    roadmap: [
      { step: "Tuần 1", action: "Định nghĩa lại USP rõ ràng và thu thập 10 insight sâu sắc từ khách hàng VIP." },
      { step: "Tuần 2", action: "Quy chuẩn hóa và đưa toàn bộ dữ liệu khách hàng lên Google Sheets tập trung." },
      { step: "Tuần 3", action: "Thiết lập phễu thu thập thông tin khách hàng tự động qua website/chat." },
      { step: "Tuần 4", action: "Xây dựng bảng đo lường KPI đơn giản cho đội ngũ vận hành cốt lõi." }
    ],
    topPriority: "Tập trung xây dựng tệp dữ liệu khách hàng tập trung (CRM/Google Sheets) để làm bàn đạp ứng dụng AI.",
    isFallback: true
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Chatbot endpoint: GUIDES client through diagnostic logic
app.post("/api/chat", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Use fallback logic if API key is not provided
  if (!apiKey || apiKey.includes("your_gemini_api_key_here")) {
    console.log("Using local chatbot response...");
    const localResult = handleLocalChat(history);
    return res.json(localResult);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      }
    });

    const userMessagesCount = history.filter(m => m.role === "user").length;

    let systemPromptBase = "";
    try {
      systemPromptBase = fs.readFileSync(path.resolve("system-prompt.txt"), "utf8");
    } catch (err) {
      console.warn("Could not read system-prompt.txt, using fallback prompt...", err);
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

    const systemPrompt = `${systemPromptBase}

- Hiện tại, buổi chat đang ở lượt thứ ${userMessagesCount + 1}/10. 

Lịch sử cuộc hội thoại:
${history.map(m => `${m.role === "user" ? "CEO" : "AI"}: ${m.content}`).join("\n")}
AI:`;

    console.log(`Generating AI chat response for turn ${userMessagesCount}`);
    const result = await model.generateContent(systemPrompt);
    const replyText = result.response.text().trim();

    // Determine current stage based on length
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

    res.json({ reply: replyText, stage });
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    // Fallback to local chatbot message on failure
    const localResult = handleLocalChat(history);
    res.json(localResult);
  }
});

// Report generation endpoint: Analyzes the chat history and outputs structured audit JSON
app.post("/api/report", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Lịch sử trò chuyện không hợp lệ." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("your_gemini_api_key_here")) {
    console.log("Using local report generation...");
    const localReport = generateLocalReport(history);
    return res.json(localReport);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const conversationText = history
      .map(m => `${m.role === "user" ? "CEO" : "AI Chuyên Gia"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `Bạn là một AI Chuyên Gia phân tích và tái cấu trúc mô hình kinh doanh cho SME.
Nhiệm vụ của bạn là đọc kỹ cuộc trò chuyện khảo sát định vị giữa CEO doanh nghiệp và Trợ lý AI dưới đây. Sau đó, chấm điểm (từ 0 đến 100) và đưa ra phân tích sâu sắc cho 8 tiêu chí sau:
1. businessLevel (Cấp độ giá trị của mô hình kinh doanh: Cấp 1 Bán sản phẩm, Cấp 2 Bán giải pháp, Cấp 3 Tạo trải nghiệm, Cấp 4 Hệ sinh thái)
2. usp (Khác biệt cốt lõi & USP của sản phẩm)
3. customerInsight (Mức độ thấu hiểu khách hàng mục tiêu)
4. marketing (Mức độ tối ưu phễu marketing & đường dẫn giá trị)
5. revenue (Độ đa dạng của dòng tiền & giá trị vòng đời khách hàng)
6. scalability (Khả năng nhân rộng/mở rộng kinh doanh)
7. management (Tính tự vận hành & mức độ thoát ly của CEO)
8. data (Độ sẵn sàng dữ liệu tập trung & hạ tầng ứng dụng AI)

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

    console.log("Analyzing conversation to compile Business Diagnostic Report...");
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMsg }
    ]);

    const responseText = result.response.text();
    const cleanJsonText = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJsonText);

    res.json(parsedData);
  } catch (error) {
    console.error("Gemini Report Generation API Error:", error);
    const fallback = generateLocalReport(history);
    fallback.executiveSummary = `⚠️ (Lỗi kết nối AI: ${error.message}). Bản báo cáo này được lập tự động từ lịch sử cuộc gọi cục bộ.`;
    res.json(fallback);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

export default app;
