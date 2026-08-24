import React, { useState, useRef, useEffect } from "react";
import {
  Activity, ArrowRight, Loader2, MessageCircle, Send, Lock, RotateCcw,
  Sparkles, AlertTriangle, Home, Eye, Layers, Cpu, Layout, CheckSquare,
  TrendingUp, Zap, Calendar, Award, FileText, Menu, X
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

// ---------- TABS DEFINITION ----------
const TABS = [
  { id: "welcome", num: "01", label: "Chào mừng", icon: Home },
  { id: "interview", num: "02", label: "Phỏng vấn với AI", icon: MessageCircle },
  { id: "understanding", num: "03", label: "Xác thực thông tin", icon: Eye },
  { id: "xray", num: "04", label: "Định vị mô hình", icon: Activity },
  { id: "level", num: "05", label: "Cấp độ giá trị", icon: Layers },
  { id: "bottleneck", num: "06", label: "Bản đồ điểm nghẽn", icon: AlertTriangle },
  { id: "digital", num: "07", label: "Chuyển đổi số", icon: Cpu },
  { id: "canvas", num: "08", label: "Bản đồ số (Canvas)", icon: Layout },
  { id: "priority", num: "09", label: "Hành động ưu tiên", icon: CheckSquare },
  { id: "revenue", num: "10", label: "Động cơ doanh thu", icon: TrendingUp },
  { id: "hypothesis", num: "11", label: "Giả thuyết tăng trưởng", icon: Zap },
  { id: "roadmap", num: "12", label: "Lộ trình 30 ngày", icon: Calendar },
  { id: "dna", num: "13", label: "DNA doanh nghiệp", icon: Award },
  { id: "report", num: "14", label: "Báo cáo điều hành", icon: FileText }
];

const TIERS = [
  { max: 20, label: "BÁO ĐỘNG", color: "#F76B6B", bg: "rgba(247,107,107,0.12)" },
  { max: 40, label: "YẾU", color: "#E8A33D", bg: "rgba(232,163,61,0.12)" },
  { max: 60, label: "ĐANG HÌNH THÀNH", color: "#E0C23D", bg: "rgba(224,194,61,0.12)" },
  { max: 80, label: "VỮNG VÀNG", color: "#4ADE9A", bg: "rgba(74,222,154,0.12)" },
  { max: 101, label: "DẪN ĐẦU", color: "#9C8CF7", bg: "rgba(156,140,247,0.12)" },
];

function getTier(score) {
  return TIERS.find((t) => score <= t.max) || TIERS[TIERS.length - 1];
}

const GROUP_DEFS = [
  { key: "dinhVi", label: "Định vị & Giá trị cốt lõi", shortLabel: "Định vị", weight: 35, items: ["businessLevel", "usp", "customerInsight"] },
  { key: "tangTruong", label: "Tăng trưởng & Dòng tiền", shortLabel: "Tăng trưởng", weight: 30, items: ["marketing", "revenue", "scalability"] },
  { key: "vanHanh", label: "Vận hành & Dữ liệu", shortLabel: "Vận hành", weight: 20, items: ["management", "data"] },
  { key: "sanSang", label: "Sẵn sàng chuyển đổi số", shortLabel: "Sẵn sàng số", weight: 15, items: ["readiness"] },
];

const ITEM_LABELS = {
  businessLevel: "Cấp độ giá trị", usp: "USP & khác biệt", customerInsight: "Thấu hiểu khách hàng",
  marketing: "Marketing & đường dẫn giá trị", revenue: "Doanh thu & bán thêm", scalability: "Khả năng mở rộng",
  management: "Quản trị & ra quyết định", data: "Dữ liệu & sẵn sàng AI", readiness: "Sẵn sàng chuyển đổi số",
};

const CONTACTS = [
  { name: "Phạm Xuân Thanh", phone: "0906867499" },
  { name: "Trương Vũ Linh", phone: "0939526665" },
];

function computeGroups(items) {
  if (!items) return { groups: {}, overall: 0, penalty: false };
  
  const groups = {};
  GROUP_DEFS.forEach((g) => {
    if (g.key === "sanSang") { 
      groups[g.key] = { label: g.label, score: items.readiness?.score ?? 50, weight: g.weight }; 
      return; 
    }
    const scores = g.items.map((k) => items[k]?.score ?? 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    groups[g.key] = { label: g.label, score: avg, weight: g.weight };
  });

  let overallRaw = 0, totalW = 0;
  Object.values(groups).forEach((g) => { overallRaw += g.score * g.weight; totalW += g.weight; });
  let overall = Math.round(overallRaw / totalW);
  let penalty = false;
  if (groups.dinhVi.score < 40 && overall > 50) { overall = 50; penalty = true; }
  
  return { groups, overall, penalty };
}

function formatMessageText(text) {
  if (!text) return "";
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
    let content = line;
    if (isBullet) {
      content = line.trim().replace(/^[-*]\s+/, "");
    }
    
    // Parse bold tags **text**
    const parts = content.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return <strong key={pIdx} style={{ color: "#9C8CF7" }}>{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={idx} style={{ marginLeft: "14px", marginBottom: "4px" }}>
          {formatted}
        </li>
      );
    }
    
    return (
      <p key={idx} style={{ margin: "0 0 8px 0" }}>
        {formatted}
      </p>
    );
  });
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Chào anh/chị! Tôi là Trợ lý AI phân tích và định vị mô hình kinh doanh SME. Hôm nay tôi sẽ đồng hành cùng anh/chị để rà soát, đánh giá mô hình và phát hiện các điểm nghẽn chiến lược.\n\nĐể bắt đầu, xin anh/chị chia sẻ **Tên doanh nghiệp** và **Ngành nghề/Lĩnh vực hoạt động chính** nhé."
    }
  ]);
  const [stage, setStage] = useState("MO");
  const [inputVal, setInputVal] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "interview") {
      scrollToBottom();
    }
  }, [messages, loadingChat, activeTab]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loadingChat || stage === "COMPLETED") return;

    const userText = inputVal.trim();
    setInputVal("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoadingChat(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể kết nối với máy chủ AI.");
      }

      const updatedMessages = [...newMessages, { role: "assistant", content: data.reply }];
      setMessages(updatedMessages);
      setStage(data.stage);

      if (data.stage === "COMPLETED") {
        await generateReport(updatedMessages);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Gặp lỗi khi gửi dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoadingChat(false);
    }
  };

  const generateReport = async (chatHistory) => {
    setLoadingReport(true);
    setError("");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: chatHistory })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo báo cáo định vị.");
      }

      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi tạo báo cáo định vị từ AI.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chào anh/chị! Tôi là Trợ lý AI phân tích và định vị mô hình kinh doanh SME. Hôm nay tôi sẽ đồng hành cùng anh/chị để rà soát, đánh giá mô hình và phát hiện các điểm nghẽn chiến lược.\n\nĐể bắt đầu, xin anh/chị chia sẻ **Tên doanh nghiệp** và **Ngành nghề/Lĩnh vực hoạt động chính** nhé."
      }
    ]);
    setStage("MO");
    setInputVal("");
    setReportData(null);
    setActiveTab("welcome");
    setError("");
    setIsSidebarOpen(false);
  };

  const isLocked = (tabId) => {
    if (tabId === "welcome" || tabId === "interview") return false;
    return !reportData;
  };

  // Recharts/Calculations computed only when reportData exists
  const { groups, overall, penalty } = computeGroups(reportData?.items);
  const tier = getTier(overall);
  const businessLevelScore = reportData?.items?.businessLevel?.score ?? 0;

  const radarData = reportData ? GROUP_DEFS.map((g) => ({
    subject: g.shortLabel,
    full: g.label,
    value: groups[g.key]?.score ?? 0
  })) : [];

  const itemEntries = reportData ? Object.keys(ITEM_LABELS).filter((k) => k !== "readiness" && reportData.items[k]) : [];
  const sortedItems = reportData ? [...itemEntries].sort((a, b) => (reportData.items[a]?.score ?? 0) - (reportData.items[b]?.score ?? 0)) : [];

  const activeTabDetails = TABS.find(t => t.id === activeTab);

  // Render specific content for each of the 14 tabs
  const renderTabContent = () => {
    if (isLocked(activeTab)) {
      return (
        <div className="xr-locked-screen">
          <div className="xr-lock-icon">
            <Lock size={26} />
          </div>
          <div className="xr-fr" style={{ fontSize: 18, color: "#F4F5FA", fontWeight: 700 }}>Chức năng đang khóa</div>
          <p style={{ fontSize: 13.5, color: "#8B93A8", maxWidth: 380, margin: "0 auto 12px", lineHeight: 1.6 }}>
            Vui lòng hoàn thành buổi phỏng vấn cùng Trợ lý AI tại tab <b>02. Phỏng vấn với AI</b> để mở khóa báo cáo <b>{activeTabDetails?.label}</b> này.
          </p>
          <button className="xr-btn xr-btn-primary" onClick={() => setActiveTab("interview")}>
            Đến cuộc phỏng vấn <ArrowRight size={15} />
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "welcome":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="xr-welcome-hero">
              <span className="xr-label" style={{ color: "#6C6BF5" }}>Hệ thống phân tích &amp; định vị mô hình kinh doanh</span>
              <h1 className="xr-fr" style={{ fontSize: 32, fontWeight: 800, color: "#F4F5FA", marginTop: 8, marginBottom: 12 }}>
                AI Business X-Ray
              </h1>
              <p style={{ fontSize: 14.5, color: "#B9C0D4", maxWidth: 580, margin: "0 auto 20px", lineHeight: 1.6 }}>
                Khảo sát, đánh giá và định vị mô hình doanh nghiệp SME trong kỷ nguyên Số &amp; AI. Trợ lý AI Agent sẽ phỏng vấn trực tiếp CEO để phát hiện điểm nghẽn chiến lược và đưa ra giải pháp đột phá.
              </p>
              <button className="xr-btn xr-btn-primary" onClick={() => setActiveTab("interview")}>
                Bắt đầu cuộc phỏng vấn <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="xr-welcome-grid">
              <div className="xr-welcome-card">
                <div style={{ color: "#6C6BF5", marginBottom: 10 }}><MessageCircle size={24} /></div>
                <div className="xr-fr" style={{ fontWeight: 700, fontSize: 15, color: "#F4F5FA" }}>1. Phỏng vấn AI</div>
                <p style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 6, lineHeight: 1.5 }}>
                  Trò chuyện tự nhiên với Trợ lý AI. Trả lời ~10 câu hỏi đào sâu về thực trạng doanh nghiệp.
                </p>
              </div>
              <div className="xr-welcome-card">
                <div style={{ color: "#4ADE9A", marginBottom: 10 }}><Activity size={24} /></div>
                <div className="xr-fr" style={{ fontWeight: 700, fontSize: 15, color: "#F4F5FA" }}>2. Định vị mô hình</div>
                <p style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 6, lineHeight: 1.5 }}>
                  Đánh giá tự động từ định vị giá trị, USP, marketing, dòng tiền đến vận hành và độ sẵn sàng số.
                </p>
              </div>
              <div className="xr-welcome-card">
                <div style={{ color: "#D4A24C", marginBottom: 10 }}><Zap size={24} /></div>
                <div className="xr-fr" style={{ fontWeight: 700, fontSize: 15, color: "#F4F5FA" }}>3. Bản đồ &amp; Lộ trình</div>
                <p style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 6, lineHeight: 1.5 }}>
                  Nhận lộ trình triển khai 30 ngày từng tuần và các giả thuyết tăng trưởng doanh thu thiết thực.
                </p>
              </div>
            </div>
          </div>
        );

      case "interview":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="xr-chat-container">
              <div className="xr-chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: stage === "COMPLETED" ? "#4ADE9A" : "#D4A24C" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F4F5FA" }}>
                    {stage === "COMPLETED" ? "ĐÃ HOÀN TẤT PHỎNG VẤN" : `LƯỢT PHỎNG VẤN: ${messages.filter(m => m.role === "user").length}/10`}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#6E7691" }}>AI Agent v2.5</span>
              </div>

              <div className="xr-chat-messages">
                {messages.map((m, idx) => {
                  const isLastMessage = idx === messages.length - 1;
                  return (
                    <div key={idx} className={`xr-msg-row ${m.role === "assistant" ? "assistant" : "user"}`}>
                      <div className="xr-msg-bubble">
                        {formatMessageText(m.content)}
                        
                        {stage === "COMPLETED" && isLastMessage && m.role === "assistant" && (
                          <div style={{ marginTop: "14px" }}>
                            {loadingReport ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8B93A8", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px" }}>
                                <Loader2 className="xr-spin" size={14} color="#6C6BF5" />
                                <span>Đang lập báo cáo định vị doanh nghiệp...</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="xr-btn xr-btn-primary"
                                style={{ width: "100%", padding: "10px 14px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                onClick={() => setActiveTab("understanding")}
                              >
                                Xem kết quả định vị ngay <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {loadingChat && (
                  <div className="xr-msg-row assistant">
                    <div className="xr-msg-bubble">
                      <div className="xr-typing-dots">
                        <div className="xr-typing-dot" />
                        <div className="xr-typing-dot" />
                        <div className="xr-typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div style={{ padding: "8px 16px", background: "rgba(247,107,107,0.1)", borderTop: "1px solid rgba(247,107,107,0.2)", color: "#F76B6B", fontSize: 12.5 }}>
                  {error}
                </div>
              )}

              {stage !== "COMPLETED" && (
                <form className="xr-chat-input-area" onSubmit={handleSend}>
                  <input
                    className="xr-chat-input"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={loadingChat ? "AI đang trả lời..." : "Nhập câu trả lời của anh/chị..."}
                    disabled={loadingChat}
                  />
                  <button className="xr-send-btn" type="submit" disabled={!inputVal.trim() || loadingChat}>
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        );

      case "understanding":
        return (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Xác Thực Thông Tin Doanh Nghiệp</h2>
            <p className="xr-sub">Thông tin cơ bản thu thập qua quá trình phỏng vấn được AI đúc kết.</p>
            
            <div className="xr-profile-grid">
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#6C6BF5" }}>Tên doanh nghiệp</span>
                <div className="xr-fr" style={{ fontSize: 16, fontWeight: 700, color: "#F4F5FA", marginTop: 4 }}>
                  {reportData?.profile?.bizName || "Chưa xác định"}
                </div>
              </div>
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#4ADE9A" }}>Ngành nghề / Lĩnh vực</span>
                <div className="xr-profile-val">{reportData?.profile?.industry || "Chưa xác định"}</div>
              </div>
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#D4A24C" }}>Sản phẩm chủ lực</span>
                <div className="xr-profile-val">{reportData?.profile?.product || "Chưa xác định"}</div>
              </div>
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#E8A33D" }}>Đối tượng khách hàng mục tiêu</span>
                <div className="xr-profile-val">{reportData?.profile?.targetCustomer || "Chưa xác định"}</div>
              </div>
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#9C8CF7" }}>Tài sản &amp; Lợi thế lớn nhất</span>
                <div className="xr-profile-val">{reportData?.profile?.assets || "Chưa xác định"}</div>
              </div>
              <div className="xr-profile-card">
                <span className="xr-label" style={{ color: "#F76B6B" }}>Cơ hội đột phá công nghệ / AI</span>
                <div className="xr-profile-val">{reportData?.profile?.opportunities || "Chưa xác định"}</div>
              </div>
            </div>
          </div>
        );

      case "xray":
        return (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Định Vị Mô Hình Tổng Thể</h2>
            <p className="xr-sub">Điểm số tổng quan và phân bổ năng lực mô hình kinh doanh.</p>
            


            <div className="xr-responsive-grid-2">
              <div className="xr-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="xr-label">Điểm định vị tổng thể</span>
                <div className="xr-fr" style={{ fontSize: 56, color: tier.color, fontWeight: 800 }}>{overall}</div>
                <div className="xr-tier-badge" style={{ color: tier.color, background: tier.bg }}>
                  {tier.label}
                </div>
                {penalty && (
                  <p style={{ fontSize: 11, color: "#8B93A8", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                    * Điểm bị giới hạn ở mức 50 do phần Định vị &amp; Giá trị cốt lõi còn yếu. Việc đầu tư công nghệ/AI sẽ không hiệu quả nếu mô hình kinh doanh gốc chưa vững.
                  </p>
                )}
              </div>

              <div className="xr-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="xr-label" style={{ alignSelf: "flex-start" }}>Biểu đồ phân bổ năng lực</span>
                <div style={{ width: "100%", height: 200, display: "flex", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="#1E2536" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#8B93A8", fontSize: 10.5 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4C5468", fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#6C6BF5" fill="#6C6BF5" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ backgroundColor: "#131926", borderColor: "#2E3547", borderRadius: 6 }} itemStyle={{ color: "#F4F5FA" }} labelStyle={{ color: "#8B93A8" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="xr-card">
              <span className="xr-label">Phân bổ chi tiết 4 nhóm năng lực</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {GROUP_DEFS.map(g => (
                  <div key={g.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#B9C0D4" }}>
                      <span>{g.label}</span>
                      <span style={{ fontWeight: 700, color: "#F4F5FA" }}>{groups[g.key]?.score ?? 0}/100</span>
                    </div>
                    <div className="xr-bar-track" style={{ height: 6 }}>
                      <div className="xr-bar-fill" style={{ width: `${groups[g.key]?.score ?? 0}%`, background: "#6C6BF5" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "level":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Cấp Độ Giá Trị Mô Kinh Doanh</h2>
            <p className="xr-sub">
              Theo khung lý thuyết, doanh nghiệp có 4 cấp độ giá trị tăng dần. Mức độ bền vững càng cao khi cấp độ càng dịch chuyển lên phía trên.
            </p>
            
            <div className="xr-level-timeline">
              {[
                { lvl: 4, name: "Cấp 4: Hệ sinh thái (Ecosystem)", desc: "Tạo lập nền tảng liên kết nhiều đối tác, khách hàng tự tương tác tạo giá trị. Doanh thu thụ động.", min: 76 },
                { lvl: 3, name: "Cấp 3: Tạo trải nghiệm (Experience)", desc: "Bán cảm xúc, sự gắn kết cá nhân hóa, khách hàng trung thành bền vững.", min: 51 },
                { lvl: 2, name: "Cấp 2: Bán giải pháp (Solution)", desc: "Giải quyết trọn vẹn điểm đau của khách hàng thay vì chỉ bán sản phẩm đơn lẻ.", min: 26 },
                { lvl: 1, name: "Cấp 1: Bán sản phẩm (Commodity)", desc: "Cạnh tranh gay gắt về giá, giao dịch ngắn hạn, dễ bị thay thế.", min: 0 }
              ].map(item => {
                const isActive = businessLevelScore >= item.min && (item.lvl === 4 || businessLevelScore < item.min + 25);
                return (
                  <div key={item.lvl} className={`xr-level-node ${isActive ? 'active' : ''}`}>
                    <div className="xr-level-badge">{item.lvl}</div>
                    <div>
                      <div className="xr-level-title">{item.name} {isActive && <span style={{ color: "#6C6BF5", fontSize: 11, marginLeft: 8 }}>(Hiện tại của bạn)</span>}</div>
                      <div className="xr-level-desc">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="xr-card" style={{ marginTop: 20 }}>
              <span className="xr-label" style={{ color: "#F76B6B" }}>Bằng chứng thực tế</span>
              <p style={{ fontSize: 13.5, color: "#B9C0D4", margin: "4px 0 16px" }}>{reportData?.items?.businessLevel?.evidence}</p>
              
              <span className="xr-label" style={{ color: "#E8A33D" }}>Rủi ro chính</span>
              <p style={{ fontSize: 13.5, color: "#B9C0D4", margin: "4px 0 16px" }}>{reportData?.items?.businessLevel?.risk}</p>
              
              <span className="xr-label" style={{ color: "#4ADE9A" }}>Đề xuất nâng cấp cấp độ giá trị</span>
              <p style={{ fontSize: 13.5, color: "#F4F5FA", margin: "4px 0 0", fontWeight: 500 }}>{reportData?.items?.businessLevel?.recommendation}</p>
            </div>
          </div>
        );

      case "bottleneck":
        return (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Bản Đồ Điểm Nghẽn Chiến Lược</h2>
            <p className="xr-sub">Danh sách 8 tiêu chí cốt lõi, được sắp xếp từ khía cạnh yếu nhất đến mạnh nhất của doanh nghiệp.</p>
            
            <div className="xr-detail-grid">
              {sortedItems.map(k => {
                const it = reportData.items[k];
                if (!it) return null;
                const c = getTier(it.score).color;
                return (
                  <div key={k} style={{ background: "#0B0F1A", border: "1px solid #1E2536", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, color: "#F4F5FA" }}>
                      <span>{ITEM_LABELS[k]}</span>
                      <span style={{ color: c }}>{it.score}/100</span>
                    </div>
                    <div className="xr-bar-track">
                      <div className="xr-bar-fill" style={{ width: `${it.score}%`, background: c }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#8B93A8", marginTop: 8 }}>
                      <div><b style={{ color: "#E7E9F0" }}>Thực trạng:</b> {it.evidence}</div>
                      <div><b style={{ color: "#F76B6B" }}>Rủi ro:</b> {it.risk}</div>
                      <div><b style={{ color: "#4ADE9A" }}>Đề xuất:</b> {it.recommendation}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "digital":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Mức Độ Sẵn Sàng Chuyển Đổi Số &amp; AI</h2>
            <p className="xr-sub">Đánh giá khả năng ứng dụng công nghệ và mức độ tối ưu hóa hạ tầng dữ liệu của doanh nghiệp.</p>
            
            <div className="xr-responsive-grid-2">
              <div className="xr-card" style={{ textAlign: "center" }}>
                <span className="xr-label">Sẵn sàng chuyển đổi số</span>
                <div className="xr-fr" style={{ fontSize: 38, color: "#9C8CF7", fontWeight: 800, marginTop: 6 }}>
                  {reportData?.items?.readiness?.score ?? 0}/100
                </div>
                <p style={{ fontSize: 11.5, color: "#8B93A8", marginTop: 8 }}>Mức độ nhận thức số của tổ chức.</p>
              </div>
              <div className="xr-card" style={{ textAlign: "center" }}>
                <span className="xr-label">Hạ tầng &amp; Dữ liệu số</span>
                <div className="xr-fr" style={{ fontSize: 38, color: "#4ADE9A", fontWeight: 800, marginTop: 6 }}>
                  {reportData?.items?.data?.score ?? 0}/100
                </div>
                <p style={{ fontSize: 11.5, color: "#8B93A8", marginTop: 8 }}>Độ tập trung và chính xác của dữ liệu.</p>
              </div>
            </div>

            <div className="xr-card">
              <span className="xr-label">Danh sách kiểm tra công nghệ (Technology Checklist)</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
                {[
                  { label: "Dữ liệu khách hàng tập trung (CRM/Database chung)", done: (reportData?.items?.data?.score ?? 0) >= 40 },
                  { label: "Tự động hóa tiếp thị & CSKH (Chatbot/Zalo OA tự động)", done: (reportData?.items?.readiness?.score ?? 0) >= 50 },
                  { label: "Báo cáo chỉ số quản trị trực quan (Dashboard tự động thay Excel thủ công)", done: (reportData?.items?.management?.score ?? 0) >= 55 },
                  { label: "Ứng dụng AI tạo sinh vào quy trình sản xuất nội dung/kịch bản sales", done: (reportData?.items?.readiness?.score ?? 0) >= 60 }
                ].map((chk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#B9C0D4" }}>
                    <span style={{ 
                      width: 16, height: 16, borderRadius: 4, 
                      border: "1.5px solid", borderColor: chk.done ? "#4ADE9A" : "#6E7691",
                      background: chk.done ? "rgba(74,222,154,0.1)" : "transparent",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#4ADE9A", fontWeight: 900
                    }}>
                      {chk.done ? "✓" : ""}
                    </span>
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="xr-card">
              <span className="xr-label" style={{ color: "#9C8CF7" }}>Phân tích dữ liệu &amp; công nghệ</span>
              <div style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <div><b>Thực trạng:</b> {reportData?.items?.data?.evidence}</div>
                <div><b>Đề xuất hành động:</b> {reportData?.items?.data?.recommendation}</div>
              </div>
            </div>
          </div>
        );

      case "canvas":
        return (
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Bản Đồ Số Doanh Nghiệp (Business Model Canvas)</h2>
            <p className="xr-sub">Mô hình kinh doanh tóm tắt theo cấu trúc 9 thành phần chuẩn mực.</p>
            
            <div className="xr-canvas-grid">
              {/* 8. Key Partners */}
              <div className="xr-canvas-card xr-canvas-partners" style={{ borderColor: "#4ADE9A" }}>
                <span className="xr-label" style={{ color: "#4ADE9A" }}>8. Đối tác chính (Key Partners)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Đối tác cung ứng sản phẩm, nguyên vật liệu.<br />
                  • Đối tác vận chuyển, hoàn tất đơn hàng.<br />
                  • Đối tác cung cấp giải pháp công nghệ/AI chuyển đổi số.<br />
                  • Các đại lý, nhà phân phối chính.
                </p>
              </div>

              {/* 7. Key Activities */}
              <div className="xr-canvas-card xr-canvas-activities" style={{ borderColor: "#9C8CF7" }}>
                <span className="xr-label" style={{ color: "#9C8CF7" }}>7. Hoạt động chính (Key Activities)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Cung ứng &amp; Đảm bảo chất lượng: <b>{reportData?.profile?.product}</b>.<br />
                  • Tiếp thị đa nền tảng &amp; Quảng cáo số.<br />
                  • Tối ưu hệ thống chăm sóc, tư vấn tự động hóa.
                </p>
              </div>

              {/* 6. Key Resources */}
              <div className="xr-canvas-card xr-canvas-resources" style={{ borderColor: "#E8A33D" }}>
                <span className="xr-label" style={{ color: "#E8A33D" }}>6. Nguồn lực chính (Key Resources)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  {reportData?.profile?.assets || "Tệp khách hàng cũ trung thành, uy tín sản phẩm và nhân sự nhiệt huyết."}
                </p>
              </div>

              {/* 2. Value Propositions */}
              <div className="xr-canvas-card xr-canvas-propositions" style={{ borderColor: "#6C6BF5", background: "rgba(108,107,245,0.02)" }}>
                <span className="xr-label" style={{ color: "#6C6BF5" }}>2. Tuyên bố giá trị (Value Propositions)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Cung cấp sản phẩm chất lượng cao giải quyết trọn vẹn điểm đau của phân khúc mục tiêu.<br /><br />
                  • <b>USP &amp; Khác biệt:</b> {reportData?.items?.usp?.evidence || "Sản phẩm chất lượng vượt trội, chăm sóc tận tâm."}
                </p>
              </div>

              {/* 4. Customer Relationships */}
              <div className="xr-canvas-card xr-canvas-relationships" style={{ borderColor: "#F76B6B" }}>
                <span className="xr-label" style={{ color: "#F76B6B" }}>4. Quan hệ khách hàng (Customer Relationships)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Chăm sóc cá nhân hóa qua tệp khách hàng trung thành.<br />
                  • Hỗ trợ nhanh 24/7 qua chatbot &amp; đa kênh tin nhắn.<br />
                  • Tích lũy dữ liệu số để hiểu hành vi mua sắm.
                </p>
              </div>

              {/* 3. Channels */}
              <div className="xr-canvas-card xr-canvas-channels" style={{ borderColor: "#4ADE9A" }}>
                <span className="xr-label" style={{ color: "#4ADE9A" }}>3. Kênh phân phối (Channels)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Kênh truyền thông: Facebook, Zalo, Tiktok.<br />
                  • Kênh bán hàng: Cửa hàng offline, website, fanpage.<br />
                  • <b>Hiện trạng:</b> {reportData?.items?.marketing?.evidence}
                </p>
              </div>

              {/* 1. Customer Segments */}
              <div className="xr-canvas-card xr-canvas-segments" style={{ borderColor: "#9C8CF7" }}>
                <span className="xr-label" style={{ color: "#9C8CF7" }}>1. Phân khúc khách hàng (Customer Segments)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  {reportData?.profile?.targetCustomer || "Khách hàng mục tiêu đại chúng và các đối tác phân phối chính."}
                </p>
              </div>

              {/* 9. Cost Structure */}
              <div className="xr-canvas-card xr-canvas-costs" style={{ borderColor: "#E8A33D" }}>
                <span className="xr-label" style={{ color: "#E8A33D" }}>9. Cơ cấu chi phí (Cost Structure)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Chi phí nhập hàng, giá vốn bán hàng (COGS) &amp; vận hành cửa hàng.<br />
                  • Chi phí tiếp thị &amp; quảng cáo trả phí (CAC).<br />
                  • Chi phí lương nhân viên &amp; chi phí bản quyền công nghệ phần mềm CRM/ERP.
                </p>
              </div>

              {/* 5. Revenue Streams */}
              <div className="xr-canvas-card xr-canvas-revenues" style={{ borderColor: "#6C6BF5" }}>
                <span className="xr-label" style={{ color: "#6C6BF5" }}>5. Dòng doanh thu (Revenue Streams)</span>
                <p style={{ fontSize: 12, color: "#B9C0D4", marginTop: 8, lineHeight: 1.6 }}>
                  • Doanh thu trực tiếp từ bán sản phẩm: <b>{reportData?.profile?.product}</b>.<br />
                  • Doanh thu lặp lại từ chăm sóc khách hàng cũ quay lại mua hàng.<br />
                  • <b>Thực trạng:</b> {reportData?.items?.revenue?.evidence}
                </p>
              </div>
            </div>
          </div>
        );

      case "priority":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Hành Động Ưu Tiên Hàng Đầu</h2>
            <p className="xr-sub">Việc doanh nghiệp cần tập trung giải quyết ngay lập tức để tháo gỡ điểm nghẽn chí tử.</p>
            
            <div className="xr-card accent" style={{ padding: "30px 24px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ background: "#6C6BF5", padding: 10, borderRadius: 10, color: "#fff", flexShrink: 0 }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="xr-label" style={{ color: "#6C6BF5" }}>VIỆC CẦN LÀM NGAY LẬP TỨC:</span>
                  <div className="xr-fr" style={{ fontSize: 18, color: "#F4F5FA", fontWeight: 700, marginTop: 6, lineHeight: 1.5 }}>
                    {reportData?.topPriority}
                  </div>
                </div>
              </div>
            </div>

            <div className="xr-card">
              <span className="xr-label">Tại sao cần ưu tiên việc này?</span>
              <p style={{ fontSize: 13.5, color: "#B9C0D4", lineHeight: 1.6, margin: "8px 0 0" }}>
                Dựa trên các triệu chứng về việc kinh doanh phụ thuộc vào CEO, tệp dữ liệu phân tán, và khả năng thu hút khách mới giảm sút, điểm nghẽn này chính là chiếc \"phanh tay\" đang kìm hãm đà tăng trưởng của tổ chức. Giải quyết điểm nghẽn này giúp doanh nghiệp giải phóng sức lao động của ban lãnh đạo và tạo tiền đề vững chắc trước khi tiến hành tự động hóa bằng công nghệ AI.
              </p>
            </div>
          </div>
        );

      case "revenue":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Phân Tích Động Cơ Doanh Thu</h2>
            <p className="xr-sub">Rà soát khả năng sinh dòng tiền bền vững và tối ưu hóa chi phí thu hút khách hàng (CAC).</p>
            
            <div className="xr-responsive-grid-2">
              <div className="xr-card">
                <span className="xr-label">Marketing &amp; Phễu giá trị</span>
                <div className="xr-fr" style={{ fontSize: 26, color: "#6C6BF5", fontWeight: 700, marginTop: 4 }}>
                  {reportData?.items?.marketing?.score ?? 0}/100
                </div>
                <p style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 8, lineHeight: 1.4 }}>
                  <b>Thực trạng:</b> {reportData?.items?.marketing?.evidence}
                </p>
              </div>
              
              <div className="xr-card">
                <span className="xr-label">Dòng tiền &amp; Giá trị trọn đời</span>
                <div className="xr-fr" style={{ fontSize: 26, color: "#4ADE9A", fontWeight: 700, marginTop: 4 }}>
                  {reportData?.items?.revenue?.score ?? 0}/100
                </div>
                <p style={{ fontSize: 12.5, color: "#8B93A8", marginTop: 8, lineHeight: 1.4 }}>
                  <b>Thực trạng:</b> {reportData?.items?.revenue?.evidence}
                </p>
              </div>
            </div>

            <div className="xr-card">
              <span className="xr-label">Đề xuất tối ưu hóa phễu doanh thu</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, fontSize: 13, color: "#B9C0D4" }}>
                <div>• <b>Về phễu thu hút:</b> {reportData?.items?.marketing?.recommendation}</div>
                <div>• <b>Về giữ chân &amp; bán thêm:</b> {reportData?.items?.revenue?.recommendation}</div>
              </div>
            </div>
          </div>
        );

      case "hypothesis":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Giả Thuyết Tăng Trưởng Doanh Thu</h2>
            <p className="xr-sub">Các kịch bản cải thiện mô hình vận hành và kinh doanh giúp nâng cao hiệu suất tài chính.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(reportData?.revenueHypotheses || []).map((hyp, idx) => (
                <div key={idx} className="xr-card" style={{ display: "flex", gap: 14, alignItems: "flex-start", margin: 0 }}>
                  <div style={{ background: "rgba(156, 140, 247, 0.1)", color: "#9C8CF7", padding: 8, borderRadius: 8, flexShrink: 0 }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <span className="xr-label" style={{ color: "#9C8CF7" }}>Giả thuyết {idx + 1}</span>
                    <p style={{ fontSize: 13.5, color: "#F4F5FA", marginTop: 4, lineHeight: 1.5, margin: 0 }}>{hyp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "roadmap":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Lộ Trình Triển Khai 30 Ngày</h2>
            <p className="xr-sub">Các bước cụ thể cần làm theo tuần để giải quyết các điểm nghẽn vừa phát hiện.</p>
            
            <div className="xr-card">
              {(reportData?.roadmap || []).map((step, idx) => (
                <div key={idx} className="xr-roadmap-item">
                  <div className="xr-roadmap-dot">{idx + 1}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#F4F5FA" }}>{step.step}</div>
                    <div style={{ fontSize: 13, color: "#B9C0D4", marginTop: 2, lineHeight: 1.4 }}>{step.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "dna":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">DNA &amp; Văn Hóa Doanh Nghiệp</h2>
            <p className="xr-sub">Đặc trưng văn hóa vận hành cốt lõi và phong cách quản trị của ban lãnh đạo.</p>
            
            <div className="xr-card">
              <div className="xr-dna-row">
                <div style={{ background: "rgba(108, 107, 245, 0.1)", color: "#6C6BF5", padding: 8, borderRadius: 8, flexShrink: 0 }}>
                  <Layers size={18} />
                </div>
                <div style={{ marginLeft: 14 }}>
                  <span className="xr-label">Phong cách vận hành chủ đạo</span>
                  <div style={{ fontSize: 13.5, color: "#F4F5FA", fontWeight: 600, marginTop: 2 }}>
                    {reportData?.businessDNA?.style}
                  </div>
                </div>
              </div>

              <div className="xr-dna-row">
                <div style={{ background: "rgba(74, 222, 154, 0.1)", color: "#4ADE9A", padding: 8, borderRadius: 8, flexShrink: 0 }}>
                  <Award size={18} />
                </div>
                <div style={{ marginLeft: 14 }}>
                  <span className="xr-label">Văn hóa tổ chức</span>
                  <div style={{ fontSize: 13.5, color: "#F4F5FA", fontWeight: 600, marginTop: 2 }}>
                    {reportData?.businessDNA?.culture}
                  </div>
                </div>
              </div>

              <div className="xr-dna-row" style={{ borderBottom: "none" }}>
                <div style={{ background: "rgba(232, 163, 61, 0.1)", color: "#E8A33D", padding: 8, borderRadius: 8, flexShrink: 0 }}>
                  <Activity size={18} />
                </div>
                <div style={{ marginLeft: 14 }}>
                  <span className="xr-label">Cơ chế ra quyết định của CEO</span>
                  <div style={{ fontSize: 13.5, color: "#F4F5FA", fontWeight: 600, marginTop: 2 }}>
                    {reportData?.businessDNA?.decisionMaking}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "report":
        return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 className="xr-fr xr-h1">Báo Cáo Tóm Tắt Điều Hành</h2>
            <p className="xr-sub">Bản đúc kết cô đọng nhất dành riêng cho CEO và Hội đồng quản trị.</p>
            
            <div className="xr-card">
              <span className="xr-label">Tóm tắt điều hành từ AI</span>
              <p style={{ fontSize: 14, color: "#D6DAE6", lineHeight: 1.6, marginTop: 6, marginBottom: 0 }}>
                {reportData?.executiveSummary}
              </p>
            </div>

            <div className="xr-card accent">
              <span className="xr-label" style={{ color: "#9C8CF7" }}>Đồng hành cùng Chuyên gia CDO</span>
              <p style={{ fontSize: 13, color: "#D6DAE6", lineHeight: 1.5, marginTop: 4, marginBottom: 12 }}>
                Chúng tôi có thể đồng hành cùng anh/chị để số hóa quy trình, thiết lập hệ thống dữ liệu tập trung và ứng dụng AI tự động hóa. Hãy kết nối trực tiếp qua Zalo:
              </p>
              {CONTACTS.map((c) => (
                <div key={c.phone} className="xr-contact-row">
                  <span style={{ color: "#F4F5FA", fontWeight: 600 }}>{c.name}</span>
                  <a 
                    href={`https://zalo.me/${c.phone}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, color: "#6C6BF5", textDecoration: "none", fontWeight: 700 }}
                  >
                    <MessageCircle size={14} /> {c.phone}
                  </a>
                </div>
              ))}
            </div>

            <button className="xr-btn xr-btn-secondary" style={{ width: "100%", gap: 8, marginTop: 10 }} onClick={handleReset}>
              <RotateCcw size={15} /> Làm lại đánh giá định vị mới
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="xr-app-layout">
      {/* Mobile Top Bar */}
      <div className="xr-mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="xr-logo-icon" style={{ width: 28, height: 28 }}><Activity size={15} /></div>
          <div>
            <div className="xr-fr" style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>AI BUSINESS X-RAY</div>
            <div style={{ fontSize: 8, color: "#6E7691" }}>DIAGNOSTIC PLATFORM</div>
          </div>
        </div>
        <button className="xr-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Responsive Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="xr-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Left Sidebar Layout */}
      <div className={`xr-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="xr-logo">
          <div className="xr-logo-icon"><Activity size={16} /></div>
          <div>
            <div className="xr-logo-title">AI BUSINESS X-RAY</div>
            <div className="xr-logo-sub">DIAGNOSTIC PLATFORM</div>
          </div>
        </div>

        <div className="xr-nav-list">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const locked = isLocked(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`xr-nav-item ${active ? "active" : ""} ${locked ? "locked" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
              >
                <span className="xr-nav-num">{tab.num}</span>
                <span className="xr-nav-label">{tab.label}</span>
                {locked ? (
                  <Lock size={12} className="xr-nav-lock" />
                ) : (
                  active && <Sparkles size={11} color="#FFF" />
                )}
              </button>
            );
          })}
        </div>

        <div className="xr-sidebar-footer">
          <div className="xr-avatar">CF</div>
          <div>
            <div className="xr-avatar-title">CEO / Founder</div>
            <div className="xr-avatar-status">
              <span className="xr-status-dot" /> Online
            </div>
          </div>
        </div>
      </div>

      {/* Right Main Content */}
      <div className="xr-main-content">
        {renderTabContent()}

        {/* Next Tab Navigation Footer */}
        {reportData && activeTab !== "welcome" && activeTab !== "interview" && activeTab !== "report" && (() => {
          const currentIndex = TABS.findIndex(t => t.id === activeTab);
          const nextTab = TABS[currentIndex + 1];
          if (nextTab) {
            return (
              <div className="xr-next-tab-footer">
                <button 
                  className="xr-btn xr-btn-primary" 
                  style={{ gap: 8, padding: "10px 20px" }}
                  onClick={() => {
                    setActiveTab(nextTab.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Tiếp theo: {nextTab.num}. {nextTab.label} <ArrowRight size={14} />
                </button>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
