import React, { useState } from "react";
import {
  Target, Activity, ShieldAlert, BarChart3, Route, FileText, ArrowRight,
  CheckCircle2, Loader2, Sparkles, Phone, MessageCircle, ChevronLeft,
  Layers, Radar as RadarIcon, AlertTriangle,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";

// ---------- Content grounded in Phần 1 "Tư duy mô hình kinh doanh trong kỷ nguyên Số & AI" ----------
const LEVELS = [
  { tag: "Cấp 1", title: "Bán sản phẩm", desc: "Tập trung tính năng & giá; phụ thuộc giao dịch đơn lẻ; dễ mất khách vào tay đối thủ giá rẻ hơn." },
  { tag: "Cấp 2", title: "Bán giải pháp", desc: "Không chỉ bán cái mình có, mà giải quyết đúng vấn đề khách hàng đang cần." },
  { tag: "Cấp 3", title: "Tạo trải nghiệm", desc: "Quản trị hành trình khách hàng; dùng dữ liệu & AI cá nhân hóa, tăng giá trị vòng đời." },
  { tag: "Cấp 4", title: "Tạo hệ sinh thái giá trị", desc: "Kết nối Khách hàng – Doanh nghiệp – Đối tác – Đại lý; doanh nghiệp là nền tảng đa dòng tiền." },
];

const BOTTLENECKS = [
  { key: "doanhthu", label: "Doanh thu tăng chậm", hint: "Phụ thuộc khách quen hoặc vài sản phẩm chủ lực" },
  { key: "chiphi", label: "Chi phí vận hành cao", hint: "Doanh thu tăng nhưng chi phí tăng tương ứng" },
  { key: "marketing", label: "Marketing chưa hiệu quả", hint: "Chạy Ads nhiều nhưng không rõ khách từ đâu, vì sao rời đi" },
  { key: "quantri", label: "Quản trị thủ công", hint: "CEO là 'nút thắt cổ chai', quyết định theo cảm tính" },
  { key: "dulieu", label: "Dữ liệu phân tán", hint: "Dữ liệu rải rác ở Zalo, máy tính từng nhân viên" },
  { key: "morong", label: "Khó mở rộng quy mô", hint: "Càng mở rộng càng rối, chi phí cố định tăng nhanh" },
];

const QUESTIONS = [
  { key: "khacbiet", q: "Khác biệt của bạn là gì?", hint: "Che tên thương hiệu đi, khách hàng còn lý do gì để chọn bạn?" },
  { key: "khachhang", q: "Khách hàng mục tiêu là ai?", hint: "Ai cần bạn nhất? Điểm đau của họ là gì?" },
  { key: "tiepcan", q: "Khách hàng tìm thấy bạn bằng cách nào?", hint: "Đã có đường dẫn từ Internet đến doanh thu chưa?" },
  { key: "banthem", q: "Làm sao bán được nhiều hơn?", hint: "Tăng giá trị trên cùng một khách hàng bằng cách nào?" },
  { key: "morong2", q: "Mở rộng mà không tăng tương ứng chi phí — làm sao?", hint: "Việc gì có thể chuẩn hóa, số hóa, tự động hóa?" },
];

const CHECKLIST = [
  "Đã xác định USP thực sự, không chỉ mô tả sản phẩm",
  "Đã có chân dung khách hàng mục tiêu với insight cụ thể",
  "Đã có hệ thống phễu Marketing dẫn khách đến doanh thu",
  "Dữ liệu doanh nghiệp đã tập trung, sẵn sàng cho AI phân tích",
  "Mô hình kinh doanh có thể nhân bản nhanh sang thị trường mới",
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
  { key: "dinhVi", label: "Định vị & Giá trị cốt lõi", weight: 35, items: ["businessLevel", "usp", "customerInsight"] },
  { key: "tangTruong", label: "Tăng trưởng & Dòng tiền", weight: 30, items: ["marketing", "revenue", "scalability"] },
  { key: "vanHanh", label: "Vận hành & Dữ liệu", weight: 20, items: ["management", "data"] },
  { key: "sanSang", label: "Sẵn sàng chuyển đổi số", weight: 15, items: ["readiness"] },
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

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function emptyState() {
  const bn = {}; BOTTLENECKS.forEach((b) => (bn[b.key] = 0));
  const ans = {}; QUESTIONS.forEach((q) => (ans[q.key] = ""));
  return {
    step: 0, bizName: "", industry: "", product: "", level: null,
    bn, ans, checks: [false, false, false, false, false],
    loading: false, error: "", result: null, leadName: "", leadPhone: "", leadSent: false,
  };
}

// ---------- Deterministic fallback scoring (used if AI call fails) ----------
function fallbackDiagnostic(s) {
  const levelScore = [20, 50, 75, 95][s.level ?? 0];
  const bnScore = (key) => 100 - (s.bn[key] - 1) * 20; // 1(no issue)->100 ... 5(severe)->20
  const items = {
    businessLevel: { score: levelScore, evidence: LEVELS[s.level ?? 0].title, risk: "Chưa xác minh bằng AI.", recommendation: "Rà soát lại mô hình kinh doanh theo 4 cấp độ giá trị." },
    usp: { score: s.ans.khacbiet.trim() ? 55 : 30, evidence: s.ans.khacbiet || "(chưa trả lời)", risk: "USP chưa rõ có thể khiến bạn rơi vào cuộc chiến giá.", recommendation: "Viết lại USP theo góc nhìn khách hàng, không phải góc nhìn sản phẩm." },
    customerInsight: { score: s.ans.khachhang.trim() ? 55 : 30, evidence: s.ans.khachhang || "(chưa trả lời)", risk: "Thiếu insight rõ ràng dễ marketing sai đối tượng.", recommendation: "Phác thảo chân dung khách hàng mục tiêu chi tiết hơn." },
    marketing: { score: bnScore("marketing"), evidence: s.ans.tiepcan || BOTTLENECKS.find(b=>b.key==="marketing").hint, risk: "Chi phí tiếp cận khách hàng có thể tăng cao.", recommendation: "Xây hệ thống phễu Marketing thay vì chạy Ads rời rạc." },
    revenue: { score: bnScore("doanhthu"), evidence: s.ans.banthem || BOTTLENECKS.find(b=>b.key==="doanhthu").hint, risk: "Dòng tiền phụ thuộc ít nguồn, dễ tổn thương.", recommendation: "Mở thêm kênh bán, bán chéo, doanh thu định kỳ." },
    scalability: { score: bnScore("morong"), evidence: s.ans.morong2 || BOTTLENECKS.find(b=>b.key==="morong").hint, risk: "Mở rộng sẽ kéo theo chi phí tăng tương ứng.", recommendation: "Chuẩn hóa quy trình trước khi tăng quy mô." },
    management: { score: bnScore("quantri"), evidence: BOTTLENECKS.find(b=>b.key==="quantri").hint, risk: "CEO dễ trở thành nút thắt cổ chai.", recommendation: "Chuyển quyết định từ cảm tính sang dựa trên dữ liệu." },
    data: { score: bnScore("dulieu"), evidence: BOTTLENECKS.find(b=>b.key==="dulieu").hint, risk: "Dữ liệu phân tán khiến AI không thể khai thác.", recommendation: "Tập trung dữ liệu về một nơi (CRM)." },
  };
  return {
    items,
    executiveSummary: "Không thể kết nối AI để phân tích sâu lúc này. Kết quả dưới đây được tính từ chính câu trả lời của bạn theo khung Tư duy mô hình kinh doanh trong kỷ nguyên Số & AI.",
    roadmap: [
      { step: "Tuần 1", action: "Làm rõ lại USP và chân dung khách hàng mục tiêu." },
      { step: "Tuần 2", action: "Rà soát điểm nghẽn được chấm điểm cao nhất ở trên." },
      { step: "Tuần 3", action: "Thiết kế 1 thử nghiệm nhỏ để giải quyết điểm nghẽn đó." },
      { step: "Tuần 4", action: "Đo lường kết quả và quyết định có mở rộng hay không." },
    ],
    topPriority: "Ưu tiên xử lý điểm nghẽn có điểm số thấp nhất trong biểu đồ trước khi đầu tư công nghệ.",
    fallback: true,
  };
}

function computeGroups(items, readinessScore) {
  const groups = {};
  GROUP_DEFS.forEach((g) => {
    if (g.key === "sanSang") { groups[g.key] = { label: g.label, score: readinessScore, weight: g.weight }; return; }
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

export default function App() {
  const [s, setS] = useState(emptyState());
  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));

  const progress = s.step >= 1 && s.step <= 5 ? s.step : 0;

  async function runDiagnostic() {
    set({ loading: true, error: "" });
    try {
      const bnText = BOTTLENECKS.map((b) => `${b.label}: ${s.bn[b.key]}/5 (5=rất nghiêm trọng)`).join("\n");
      const ansText = QUESTIONS.map((q) => `${q.q} -> ${s.ans[q.key] || "(chưa trả lời)"}`).join("\n");
      const level = LEVELS[s.level];
      const system = `Bạn là AI chẩn đoán doanh nghiệp SME theo khung "Tư duy mô hình kinh doanh trong kỷ nguyên Số & AI".
Dựa trên dữ liệu doanh nghiệp cung cấp, chấm điểm 0-100 cho từng tiêu chí sau (100 = rất tốt, 0 = rất yếu):
businessLevel, usp, customerInsight, marketing, revenue, scalability, management, data.
Với mỗi tiêu chí, đưa ra: evidence (bằng chứng từ câu trả lời của họ), risk (rủi ro nếu không cải thiện), recommendation (đề xuất cụ thể, ngắn gọn).
Chấm điểm nghiêm túc, thẳng thắn — đừng chấm cao chỉ để an ủi. Nếu câu trả lời sơ sài hoặc né tránh, điểm phải thấp và ghi rõ trong evidence.
Trả lời CHỈ bằng JSON hợp lệ, không markdown, đúng cấu trúc:
{
  "items": {
    "businessLevel": {"score":0,"evidence":"","risk":"","recommendation":""},
    "usp": {"score":0,"evidence":"","risk":"","recommendation":""},
    "customerInsight": {"score":0,"evidence":"","risk":"","recommendation":""},
    "marketing": {"score":0,"evidence":"","risk":"","recommendation":""},
    "revenue": {"score":0,"evidence":"","risk":"","recommendation":""},
    "scalability": {"score":0,"evidence":"","risk":"","recommendation":""},
    "management": {"score":0,"evidence":"","risk":"","recommendation":""},
    "data": {"score":0,"evidence":"","risk":"","recommendation":""}
  },
  "executiveSummary": "3-4 câu tóm tắt điều hành, giọng thẳng thắn",
  "roadmap": [{"step":"Tuần 1","action":"..."},{"step":"Tuần 2","action":"..."},{"step":"Tuần 3","action":"..."},{"step":"Tuần 4","action":"..."}],
  "topPriority": "1 câu nêu việc cần làm NGAY trước tiên"
}`;
      const userMsg = `Doanh nghiệp: ${s.bizName}\nNgành: ${s.industry}\nSản phẩm chủ lực: ${s.product}\nTự chọn cấp độ giá trị: ${level.tag} - ${level.title}\n\nĐiểm nghẽn tự chấm (1-5):\n${bnText}\n\nCâu trả lời chiến lược:\n${ansText}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          system,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map((b) => b.text || "").join("\n").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!parsed.items) throw new Error("missing items");
      set({ result: parsed, loading: false, step: 7 });
    } catch (e) {
      set({ result: fallbackDiagnostic(s), loading: false, step: 7 });
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0B0F1A", color: "#E7E9F0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .xr-fr { font-family: 'Fraunces', serif; }
        input, textarea { font-family: 'Inter', sans-serif; }
        input:focus, textarea:focus { outline: 2px solid #9C8CF7; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid #9C8CF7; outline-offset: 2px; }
        .xr-wrap { max-width: 720px; margin: 0 auto; padding: 18px 16px 60px; }
        @media (min-width: 640px) { .xr-wrap { padding: 30px 24px 70px; } }
        .xr-header { padding: 16px; border-bottom: 1px solid #1E2536; position: sticky; top: 0; background: #0B0F1Aee; backdrop-filter: blur(6px); z-index: 5; }
        .xr-header-inner { max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 10px; }
        .xr-badge { width: 30px; height: 30px; border-radius: 8px; background: #6C6BF5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .xr-card { background: #131A2B; border: 1px solid #232B40; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
        .xr-card.accent { border-color: #6C6BF5; background: rgba(108,107,245,0.08); }
        .xr-progress { display: flex; gap: 5px; margin-bottom: 18px; }
        .xr-seg { flex: 1; height: 4px; border-radius: 3px; background: #232B40; }
        .xr-seg.done { background: #6C6BF5; }
        .xr-h1 { font-size: 22px; margin: 0 0 6px; color: #F4F5FA; }
        .xr-sub { font-size: 13.5px; color: #8B93A8; margin: 0 0 18px; line-height: 1.55; }
        .xr-label { font-size: 11.5px; font-weight: 700; color: #6E7691; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block; }
        .xr-hint { font-size: 12px; color: #6E7691; margin-top: 4px; }
        .xr-input { width: 100%; border: 1px solid #232B40; border-radius: 8px; padding: 10px 12px; font-size: 14.5px; background: #0F1524; color: #E7E9F0; margin-bottom: 14px; }
        .xr-textarea { width: 100%; border: 1px solid #232B40; border-radius: 8px; padding: 10px 12px; font-size: 14px; background: #0F1524; color: #E7E9F0; resize: vertical; }
        .xr-level { display: block; width: 100%; text-align: left; border: 1.5px solid #232B40; border-radius: 12px; padding: 14px; margin-bottom: 10px; background: #0F1524; color: inherit; }
        .xr-level.sel { border-color: #6C6BF5; background: rgba(108,107,245,0.1); }
        .xr-level-tag { display: inline-block; font-size: 11px; font-weight: 700; color: #0B0F1A; background: #9C8CF7; padding: 2px 8px; border-radius: 20px; margin-bottom: 6px; }
        .xr-scale-row { display: flex; gap: 8px; margin-top: 8px; }
        .xr-scale-btn { flex: 1; height: 38px; border-radius: 8px; border: 1.5px solid #232B40; background: #0F1524; color: #6E7691; font-weight: 700; font-size: 13.5px; }
        .xr-scale-btn.sel { background: #6C6BF5; border-color: #6C6BF5; color: #fff; }
        .xr-scale-labels { display: flex; justify-content: space-between; font-size: 10.5px; color: #4C5468; margin-top: 4px; }
        .xr-check-row { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0; border-bottom: 1px solid #1E2536; }
        .xr-check-row:last-child { border-bottom: none; }
        .xr-checkbox { width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid #232B40; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; background: #0F1524; color: #0B0F1A; font-weight: 700; }
        .xr-checkbox.on { background: #6C6BF5; border-color: #6C6BF5; color: #fff; }
        .xr-btn-row { display: flex; gap: 10px; margin-top: 6px; }
        .xr-btn { border: none; border-radius: 9px; padding: 13px 18px; font-weight: 600; font-size: 14.5px; }
        .xr-btn-primary { background: #6C6BF5; color: #fff; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .xr-btn-primary:disabled { background: #333B54; color: #6E7691; }
        .xr-btn-secondary { background: transparent; color: #8B93A8; border: 1.5px solid #232B40; }
        .xr-btn-gold { background: #D4A24C; color: #201404; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .xr-error { color: #F76B6B; font-size: 13px; margin-top: 8px; }
        .xr-tier-badge { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; padding: 6px 12px; border-radius: 20px; }
        .xr-detail-grid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
        @media (min-width: 640px) { .xr-detail-grid { grid-template-columns: 1fr 1fr; } }
        .xr-bar-track { height: 8px; border-radius: 5px; background: #1E2536; overflow: hidden; margin: 6px 0 8px; }
        .xr-bar-fill { height: 100%; border-radius: 5px; }
        .xr-roadmap-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1E2536; }
        .xr-roadmap-item:last-child { border-bottom: none; }
        .xr-roadmap-dot { width: 26px; height: 26px; border-radius: 50%; background: #6C6BF5; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .xr-contact-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #1E2536; font-size: 13.5px; }
        .xr-contact-row:last-child { border-bottom: none; }
        .xr-loader { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 20px; text-align: center; }
        .xr-spin { animation: xrspin 1s linear infinite; }
        @keyframes xrspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="xr-header">
        <div className="xr-header-inner">
          <div className="xr-badge"><Activity size={16} color="#fff" /></div>
          <div>
            <div className="xr-fr" style={{ fontSize: 16, lineHeight: 1.1, color: "#F4F5FA" }}>AI Business X-Ray</div>
            <div style={{ fontSize: 11, color: "#6E7691" }}>Chẩn đoán hiện trạng doanh nghiệp trong kỷ nguyên Số &amp; AI</div>
          </div>
        </div>
      </div>

      <div className="xr-wrap">
        {progress > 0 && (
          <div className="xr-progress">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className={`xr-seg ${i <= progress ? "done" : ""}`} />)}
          </div>
        )}

        {s.step === 0 && <Welcome onStart={() => set({ step: 1 })} />}
        {s.step === 1 && <InfoStep s={s} set={set} />}
        {s.step === 2 && <LevelStep s={s} set={set} />}
        {s.step === 3 && <BottleneckStep s={s} set={set} />}
        {s.step === 4 && <QuestionStep s={s} set={set} />}
        {s.step === 5 && <ChecklistStep s={s} set={set} onSubmit={() => { set({ step: 6 }); runDiagnostic(); }} />}
        {s.step === 6 && <Loading />}
        {s.step === 7 && s.result && <Dashboard s={s} set={set} />}
      </div>
    </div>
  );
}

function Welcome({ onStart }) {
  return (
    <div>
      <div className="xr-card">
        <div className="xr-h1 xr-fr">Doanh nghiệp bạn đang thực sự ở đâu?</div>
        <p className="xr-sub">
          Trong kỷ nguyên Số &amp; AI, sản phẩm tốt không còn là lợi thế cạnh tranh duy nhất. Bài chẩn đoán 5 phút này
          quét qua mô hình kinh doanh của bạn và trả về một bản báo cáo điều hành: cấp độ giá trị, biểu đồ điểm nghẽn,
          và lộ trình ưu tiên nên làm trước.
        </p>
        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#B9C0D4" }}>
          <Row icon={<Layers size={14} color="#6C6BF5" />} text="Bạn đang bán ở cấp độ nào trong 4 cấp độ giá trị" />
          <Row icon={<RadarIcon size={14} color="#6C6BF5" />} text="Biểu đồ radar điểm mạnh — điểm yếu theo 4 nhóm năng lực" />
          <Row icon={<Route size={14} color="#6C6BF5" />} text="Lộ trình ưu tiên 30 ngày, việc nào làm trước" />
        </div>
      </div>
      <button className="xr-btn xr-btn-gold" onClick={onStart}>
        Bắt đầu chẩn đoán <ArrowRight size={17} />
      </button>
      <div style={{ fontSize: 11.5, color: "#4C5468", textAlign: "center", marginTop: 10 }}>
        Miễn phí · Không cần tài khoản · ~5 phút
      </div>
    </div>
  );
}
function Row({ icon, text }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{icon}<span>{text}</span></div>;
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled, loading }) {
  return (
    <div className="xr-btn-row">
      <button className="xr-btn xr-btn-secondary" onClick={onBack} disabled={loading}>
        <ChevronLeft size={15} style={{ verticalAlign: -2 }} /> Quay lại
      </button>
      <button className="xr-btn xr-btn-primary" onClick={onNext} disabled={nextDisabled || loading}>
        {nextLabel || "Tiếp tục"}
      </button>
    </div>
  );
}

function InfoStep({ s, set }) {
  const [error, setError] = useState("");
  return (
    <div>
      <div className="xr-h1 xr-fr">Về doanh nghiệp của bạn</div>
      <p className="xr-sub">Vài thông tin ngắn gọn trước khi bắt đầu.</p>
      <label className="xr-label">Tên doanh nghiệp</label>
      <input className="xr-input" value={s.bizName} placeholder="VD: Cà phê Đặc sản Miền Tây"
        onChange={(e) => set({ bizName: e.target.value })} />
      <label className="xr-label">Ngành</label>
      <input className="xr-input" value={s.industry} placeholder="VD: F&B, sản xuất, dịch vụ..."
        onChange={(e) => set({ industry: e.target.value })} />
      <label className="xr-label">Sản phẩm / dịch vụ chủ lực</label>
      <input className="xr-input" value={s.product} placeholder="Sản phẩm bạn bán nhiều nhất"
        onChange={(e) => set({ product: e.target.value })} />
      {error && <div className="xr-error">{error}</div>}
      <StepNav onBack={() => set({ step: 0 })} onNext={() => {
        if (!s.bizName.trim()) { setError("Vui lòng nhập tên doanh nghiệp."); return; }
        setError(""); set({ step: 2 });
      }} />
    </div>
  );
}

function LevelStep({ s, set }) {
  const [error, setError] = useState("");
  return (
    <div>
      <div className="xr-h1 xr-fr">Bạn đang bán ở cấp độ nào?</div>
      <p className="xr-sub">Chọn mô tả gần đúng nhất với cách khách hàng đang trải nghiệm doanh nghiệp bạn hôm nay.</p>
      {LEVELS.map((l, i) => (
        <button key={i} className={`xr-level ${s.level === i ? "sel" : ""}`} onClick={() => set({ level: i })}>
          <span className="xr-level-tag">{l.tag}</span>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, color: "#F4F5FA" }}>{l.title}</div>
          <div style={{ fontSize: 12.5, color: "#8B93A8", lineHeight: 1.5 }}>{l.desc}</div>
        </button>
      ))}
      {error && <div className="xr-error">{error}</div>}
      <StepNav onBack={() => set({ step: 1 })} onNext={() => {
        if (s.level === null) { setError("Vui lòng chọn 1 cấp độ."); return; }
        setError(""); set({ step: 3 });
      }} />
    </div>
  );
}

function BottleneckStep({ s, set }) {
  const [error, setError] = useState("");
  const setBn = (key, val) => set({ bn: { ...s.bn, [key]: val } });
  return (
    <div>
      <div className="xr-h1 xr-fr">6 điểm nghẽn thường gặp</div>
      <p className="xr-sub">Chấm điểm mức độ nghiêm trọng của từng điểm nghẽn (1 = không phải vấn đề, 5 = rất nghiêm trọng).</p>
      {BOTTLENECKS.map((b) => (
        <div key={b.key} className="xr-card" style={{ padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#F4F5FA" }}>{b.label}</div>
          <div className="xr-hint">{b.hint}</div>
          <div className="xr-scale-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} className={`xr-scale-btn ${s.bn[b.key] === i ? "sel" : ""}`} onClick={() => setBn(b.key, i)}>{i}</button>
            ))}
          </div>
          <div className="xr-scale-labels"><span>Không phải vấn đề</span><span>Rất nghiêm trọng</span></div>
        </div>
      ))}
      {error && <div className="xr-error">{error}</div>}
      <StepNav onBack={() => set({ step: 2 })} onNext={() => {
        if (BOTTLENECKS.some((b) => s.bn[b.key] === 0)) { setError("Vui lòng chấm điểm tất cả 6 mục."); return; }
        setError(""); set({ step: 4 });
      }} />
    </div>
  );
}

function QuestionStep({ s, set }) {
  const setAns = (key, val) => set({ ans: { ...s.ans, [key]: val } });
  return (
    <div>
      <div className="xr-h1 xr-fr">5 câu hỏi chiến lược</div>
      <p className="xr-sub">Trả lời càng thật, chẩn đoán càng sát. Không có câu trả lời đúng duy nhất.</p>
      {QUESTIONS.map((q) => (
        <div key={q.key} style={{ marginBottom: 16 }}>
          <label className="xr-label" style={{ textTransform: "none", fontSize: 14, color: "#F4F5FA" }}>{q.q}</label>
          <div className="xr-hint" style={{ marginBottom: 6 }}>{q.hint}</div>
          <textarea className="xr-textarea" rows={3} value={s.ans[q.key]} placeholder="Câu trả lời của bạn..."
            onChange={(e) => setAns(q.key, e.target.value)} />
        </div>
      ))}
      <StepNav onBack={() => set({ step: 3 })} onNext={() => set({ step: 5 })} />
    </div>
  );
}

function ChecklistStep({ s, set, onSubmit }) {
  const toggle = (i) => { const c = [...s.checks]; c[i] = !c[i]; set({ checks: c }); };
  return (
    <div>
      <div className="xr-h1 xr-fr">Checklist sẵn sàng chuyển đổi</div>
      <p className="xr-sub">Tích vào những điều bạn đã thực sự làm được.</p>
      <div className="xr-card" style={{ padding: "4px 16px" }}>
        {CHECKLIST.map((c, i) => (
          <div key={i} className="xr-check-row" onClick={() => toggle(i)} style={{ cursor: "pointer" }}>
            <div className={`xr-checkbox ${s.checks[i] ? "on" : ""}`}>{s.checks[i] ? "✓" : ""}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#D6DAE6" }}>{c}</div>
          </div>
        ))}
      </div>
      <StepNav onBack={() => set({ step: 4 })} onNext={onSubmit} nextLabel="Xem báo cáo chẩn đoán →" />
    </div>
  );
}

function Loading() {
  return (
    <div className="xr-loader">
      <Loader2 size={32} color="#6C6BF5" className="xr-spin" />
      <div className="xr-fr" style={{ fontSize: 17, color: "#F4F5FA" }}>Đang phân tích doanh nghiệp của bạn...</div>
      <div style={{ fontSize: 13, color: "#6E7691", maxWidth: 320 }}>
        AI đang đối chiếu câu trả lời của bạn với khung 4 cấp độ giá trị và 6 điểm nghẽn phổ biến.
      </div>
    </div>
  );
}

function Dashboard({ s, set }) {
  const r = s.result;
  const readinessScore = Math.round((s.checks.filter(Boolean).length / 5) * 100);
  const { groups, overall, penalty } = computeGroups(r.items, readinessScore);
  const tier = getTier(overall);

  const radarData = GROUP_DEFS.map((g) => ({ subject: g.label.split(" ")[0], full: g.label, value: groups[g.key].score }));

  const itemEntries = Object.keys(ITEM_LABELS).filter((k) => k !== "readiness" && r.items[k]);
  const sortedItems = [...itemEntries].sort((a, b) => r.items[a].score - r.items[b].score);

  function zaloLink(phone) { return `https://zalo.me/${phone}`; }

  return (
    <div>
      <div className="xr-card">
        <div className="xr-label">Doanh nghiệp</div>
        <div className="xr-fr" style={{ fontSize: 19, color: "#F4F5FA" }}>{s.bizName || "Chưa đặt tên"}</div>
        <div style={{ fontSize: 12.5, color: "#8B93A8" }}>{s.industry}{s.product ? " · " + s.product : ""}</div>
      </div>

      {r.fallback && (
        <div className="xr-card" style={{ borderColor: "#E8A33D" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#E8A33D" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{r.executiveSummary}</span>
          </div>
        </div>
      )}

      <div className="xr-card" style={{ textAlign: "center" }}>
        <div className="xr-label">Điểm sức khỏe tổng thể</div>
        <div className="xr-fr" style={{ fontSize: 46, color: tier.color, lineHeight: 1 }}>{overall}</div>
        <div className="xr-tier-badge" style={{ color: tier.color, background: tier.bg, marginTop: 8 }}>{tier.label}</div>
        {penalty && <div style={{ fontSize: 11.5, color: "#6E7691", marginTop: 8 }}>* Điểm bị giới hạn tối đa 50 vì nền tảng định vị còn yếu — công nghệ chưa phát huy tác dụng nếu mô hình gốc chưa vững.</div>}
      </div>

      <div className="xr-card">
        <div className="xr-label">Radar 4 nhóm năng lực</div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#232B40" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#8B93A8", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4C5468", fontSize: 9 }} />
              <Radar dataKey="value" stroke="#6C6BF5" fill="#6C6BF5" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
          {GROUP_DEFS.map((g) => (
            <div key={g.key} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", color: "#B9C0D4" }}>
              <span>{g.label}</span><span style={{ fontWeight: 700, color: "#F4F5FA" }}>{groups[g.key].score}/100</span>
            </div>
          ))}
        </div>
      </div>

      <div className="xr-card accent">
        <div className="xr-label">Việc cần làm ngay</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#F4F5FA", margin: 0 }}>{r.topPriority}</p>
      </div>

      <div className="xr-card">
        <div className="xr-label" style={{ marginBottom: 10 }}>Chi tiết từng tiêu chí (thấp → cao)</div>
        <div className="xr-detail-grid">
          {sortedItems.map((k) => {
            const it = r.items[k];
            const c = getTier(it.score).color;
            return (
              <div key={k} style={{ background: "#0F1524", border: "1px solid #232B40", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#F4F5FA" }}>
                  <span>{ITEM_LABELS[k]}</span><span style={{ color: c }}>{it.score}</span>
                </div>
                <div className="xr-bar-track"><div className="xr-bar-fill" style={{ width: `${it.score}%`, background: c }} /></div>
                <div style={{ fontSize: 11.5, color: "#6E7691", marginBottom: 4 }}><b style={{ color: "#8B93A8" }}>Bằng chứng:</b> {it.evidence}</div>
                <div style={{ fontSize: 11.5, color: "#6E7691", marginBottom: 4 }}><b style={{ color: "#8B93A8" }}>Rủi ro:</b> {it.risk}</div>
                <div style={{ fontSize: 11.5, color: "#B9C0D4" }}><b style={{ color: "#8B93A8" }}>Đề xuất:</b> {it.recommendation}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="xr-card">
        <div className="xr-label">Tóm tắt điều hành</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#D6DAE6", margin: 0 }}>{r.executiveSummary}</p>
      </div>

      <div className="xr-card">
        <div className="xr-label">Lộ trình 30 ngày</div>
        {(r.roadmap || []).map((step, i) => (
          <div key={i} className="xr-roadmap-item">
            <div className="xr-roadmap-dot">{i + 1}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#F4F5FA" }}>{step.step}</div>
              <div style={{ fontSize: 13, color: "#B9C0D4" }}>{step.action}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="xr-card accent">
        <div className="xr-label">Muốn đi sâu hơn?</div>
        <p style={{ fontSize: 13.5, color: "#D6DAE6", lineHeight: 1.6, marginTop: 0 }}>
          Đội ngũ CDO có thể đồng hành cùng bạn từ báo cáo này đến kế hoạch hành động thực tế. Liên hệ trực tiếp qua Zalo:
        </p>
        {CONTACTS.map((c) => (
          <div key={c.phone} className="xr-contact-row">
            <span style={{ color: "#F4F5FA", fontWeight: 600 }}>{c.name}</span>
            <a href={zaloLink(c.phone)} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, color: "#6C6BF5", textDecoration: "none", fontWeight: 700 }}>
              <MessageCircle size={14} /> {c.phone}
            </a>
          </div>
        ))}
      </div>

      <button className="xr-btn xr-btn-secondary" style={{ width: "100%" }} onClick={() => set(emptyState())}>
        Làm lại từ đầu
      </button>
    </div>
  );
}
