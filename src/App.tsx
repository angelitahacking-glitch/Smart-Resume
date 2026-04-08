import React, { useState } from 'react';

interface AnalysisResult {
  diagnosis: string[];
  optimizedResume: string;
  matchingSuggestions: string[];
}

const App: React.FC = () => {
  const [identity, setIdentity] = useState<'freshman' | 'professional'>('freshman');
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseIn, setIsMouseIn] = useState(false);

  // 鼠标追踪逻辑
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isMouseIn) setIsMouseIn(true);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMouseIn]);

  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const apiUrl = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
  const apiModel = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

  const callDeepSeekApi = async (data: { identity: string; resume: string; jd: string }) => {
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('请在 .env 文件中配置 VITE_DEEPSEEK_API_KEY');
    }

    const prompt = `你是一个专业的简历优化专家。请根据以下信息进行简历诊断和优化：
用户身份：${data.identity === 'freshman' ? '应届生/学生' : '职场人士'}
简历内容：${data.resume}
目标岗位JD：${data.jd}

请严格按照以下格式返回内容：
[问题诊断]: 
(至少3点)

[优化后的简历内容】: 
(优化后的完整简历文本)

[职位匹配建议】: 
(匹配度评分和具体建议)`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: 'system', content: '你是一个简历优化专家，擅长根据JD精准优化简历。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || '请求失败');
    }

    const resultData = await response.json();
    return parseResponse(resultData.choices[0].message.content);
  };

  const parseResponse = (text: string): AnalysisResult => {
    const sections: AnalysisResult = { diagnosis: [], optimizedResume: '', matchingSuggestions: [] };
    try {
      const diagnosisMatch = text.match(/\[问题诊断\]:([\s\S]*?)(?=\[优化后的简历内容】:)/);
      const resumeMatch = text.match(/\[优化后的简历内容】:([\s\S]*?)(?=\[职位匹配建议】:)/);
      const matchingMatch = text.match(/\[职位匹配建议】:([\s\S]*)/);
      if (diagnosisMatch) sections.diagnosis = diagnosisMatch[1].trim().split('\n').filter(l => l.trim());
      if (resumeMatch) sections.optimizedResume = resumeMatch[1].trim();
      if (matchingMatch) sections.matchingSuggestions = matchingMatch[1].trim().split('\n').filter(l => l.trim());
    } catch (e) {
      throw new Error('内容解析失败');
    }
    return sections;
  };

  const handleOptimize = async () => {
    if (!resume || !jd) return;
    setError(null);
    setIsLoading(true);
    try {
      const realResult = await callDeepSeekApi({ identity, resume, jd });
      setResult(realResult);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 鼠标跟随弥散光效 */}
      <div 
        className="cursor-glow"
        style={{ 
          left: `${mousePos.x}px`, 
          top: `${mousePos.y}px`,
          opacity: isMouseIn ? 1 : 0 
        }}
      ></div>

      {/* 莫兰蒂弥散背景 */}
      <div className="mesh-gradient">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Apple 风格导航栏 */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xs font-black">AI</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Resume.Pro</span>
        </div>
        <div className="flex items-center gap-8 text-[13px] font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">优化工具</a>
          <a href="#" className="hover:text-white transition-colors">简历模板</a>
          <a href="#" className="hover:text-white transition-colors">定价</a>
          <div className="h-4 w-px bg-white/10"></div>
          <button className="text-white hover:opacity-80">登录</button>
          <button className="bg-white text-black px-4 py-1.5 rounded-full font-bold hover:bg-white/90">免费试用</button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="text-center mb-24 space-y-6">
          <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wide text-white/60 mb-4">
            Next-Gen AI Powered
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
            让简历更有 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40 italic">竞争力.</span>
          </h1>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-medium">
            基于 DeepSeek-V3 引擎，为您提供 Apple 级别的简历诊断与精准优化方案。
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
          {/* Left: Input Area */}
          <div className="space-y-8">
            <div className="glass-card rounded-[32px] p-10 space-y-10">
              {/* Identity Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-white rounded-full"></span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">01. 身份设定</h3>
                </div>
                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setIdentity('freshman')}
                    className={`flex-1 py-4 rounded-[14px] text-sm font-bold transition-all duration-500 ${identity === 'freshman' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                  >
                    应届生 / 实习
                  </button>
                  <button 
                    onClick={() => setIdentity('professional')}
                    className={`flex-1 py-4 rounded-[14px] text-sm font-bold transition-all duration-500 ${identity === 'professional' ? 'bg-black text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
                  >
                    职场人士
                  </button>
                </div>
              </div>

              {/* Textareas Section */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">02. 简历正文</h3>
                    <span className="text-[10px] text-white/20 uppercase">Paste text here</span>
                  </div>
<<<<<<< HEAD
                  <div className="w-full">
                    <textarea 
                      className="w-full h-64 glass-input rounded-3xl p-6 text-base leading-relaxed resize-none text-white/80 placeholder:text-white/10"
                      placeholder="在这里粘贴您的简历全文..."
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      style={{ 
                        wordWrap: 'break-word', 
                        wordBreak: 'break-all', 
                        whiteSpace: 'normal', 
                        boxSizing: 'border-box', 
                        width: '100%', 
                        maxWidth: '100%',
                        overflowY: 'auto'
                      }}
                    ></textarea>
                  </div>
=======
                  <textarea 
                    className="w-full h-64 glass-input rounded-3xl p-6 text-base leading-relaxed resize-none text-white/80 placeholder:text-white/10"
                    placeholder="在这里粘贴您的简历全文..."
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                  ></textarea>
>>>>>>> f5896852d5d3cc2eea49229113552b8187814cbb
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">03. 岗位描述 (JD)</h3>
                    <span className="text-[10px] text-white/20 uppercase">Target position</span>
                  </div>
<<<<<<< HEAD
                  <div className="w-full">
                    <textarea 
                      className="w-full h-64 glass-input rounded-3xl p-6 text-base leading-relaxed resize-none text-white/80 placeholder:text-white/10"
                      placeholder="粘贴您想申请的职位描述..."
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      style={{ 
                        wordWrap: 'break-word', 
                        wordBreak: 'break-all', 
                        whiteSpace: 'normal', 
                        boxSizing: 'border-box', 
                        width: '100%', 
                        maxWidth: '100%',
                        overflowY: 'auto'
                      }}
                    ></textarea>
                  </div>
=======
                  <textarea 
                    className="w-full h-64 glass-input rounded-3xl p-6 text-base leading-relaxed resize-none text-white/80 placeholder:text-white/10"
                    placeholder="粘贴您想申请的职位描述..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  ></textarea>
>>>>>>> f5896852d5d3cc2eea49229113552b8187814cbb
                </div>
              </div>

              <button 
                onClick={handleOptimize}
                disabled={isLoading || !resume || !jd}
                className="w-full premium-button py-6 rounded-2xl text-lg flex items-center justify-center gap-3 disabled:opacity-20"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-circle-notch animate-spin"></i>
                    AI 深度分析中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sparkles"></i>
                    开启智能诊断
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 font-medium animate-pulse">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Output Area */}
          <div className="sticky top-32">
<<<<<<< HEAD
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-1000">
              {!result && !isLoading ? (
                <div className="glass-card rounded-[40px] h-[792px] p-20 flex flex-col items-center justify-center text-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10 transition-transform duration-700 group-hover:rotate-[360deg]">
                    <i className="fas fa-magic text-3xl text-white/20"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">等待数据输入</h3>
                  <p className="text-white/30 max-w-xs font-medium leading-relaxed">
                    在左侧填写简历和岗位信息后，AI 将在此展示电影级的高级优化建议。
                  </p>
                </div>
              ) : isLoading ? (
                <div className="glass-card rounded-[40px] p-12 flex flex-col items-center justify-center relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.05] via-transparent to-transparent animate-scan"></div>
                  <div className="flex flex-col items-center space-y-8">
                    <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-white animate-spin flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin-slow"></div>
                    </div>
                    <div className="text-center space-y-4">
                      <h3 className="text-2xl font-bold text-white/80">AI 深度分析中</h3>
                      <p className="text-white/40 max-w-md">正在对您的简历和岗位需求进行智能匹配分析，请稍候...</p>
                      <div className="flex items-center justify-center space-x-2 mt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 诊断板块 */}
                  {result && (
                    <section className="glass-card rounded-[32px] p-10 relative group">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">问题诊断</h3>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60">Insight</span>
                      </div>
                      <div className="space-y-6">
                        {result.diagnosis.map((item, idx) => (
                          <div key={idx} className="flex gap-6 items-start group/item">
                            <span className="text-xl font-black text-white/10 group-hover/item:text-white/40 transition-colors">0{idx+1}</span>
                            <p className="text-lg font-medium leading-relaxed text-white/80">{item}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 方案板块 */}
                  {result && (
                    <section className="glass-card rounded-[32px] p-10 bg-gradient-to-br from-white/[0.08] to-transparent">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">优化方案</h3>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(result.optimizedResume);
                            alert('已复制');
                          }}
                          className="text-[10px] font-bold uppercase text-white/40 hover:text-white flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"
                        >
                          <i className="fas fa-copy"></i> Copy
                        </button>
                      </div>
                      <div className="bg-black/40 rounded-2xl p-8 font-mono text-sm leading-loose text-white/60 border border-white/5 shadow-inner whitespace-pre-wrap break-all">
                        {result.optimizedResume}
                      </div>
                    </section>
                  )}

                  {/* 匹配板块 */}
                  {result && (
                    <section className="glass-card rounded-[32px] p-10">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">职位匹配</h3>
                        <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-white' : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-6">
                        {result.matchingSuggestions.map((item, idx) => (
                          <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6 hover:bg-white/[0.05] transition-all duration-500">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                              <i className="fas fa-arrow-right text-[10px] text-white/40"></i>
                            </div>
                            <p className="text-sm font-bold text-white/80">{item}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
=======
            {!result && !isLoading ? (
              <div className="glass-card rounded-[40px] h-[800px] flex flex-col items-center justify-center p-20 text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10 transition-transform duration-700 group-hover:rotate-[360deg]">
                  <i className="fas fa-magic text-3xl text-white/20"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">等待数据输入</h3>
                <p className="text-white/30 max-w-xs font-medium leading-relaxed">
                  在左侧填写简历和岗位信息后，AI 将在此展示电影级的高级优化建议。
                </p>
              </div>
            ) : isLoading ? (
              <div className="glass-card rounded-[40px] h-[800px] overflow-hidden p-12 space-y-12 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.05] via-transparent to-transparent animate-scan"></div>
                <div className="space-y-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-6">
                      <div className="h-6 w-1/4 bg-white/5 rounded-full"></div>
                      <div className="h-32 w-full bg-white/5 rounded-3xl"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-1000">
                {/* 诊断板块 */}
                {result && (
                  <section className="glass-card rounded-[32px] p-10 relative group">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">问题诊断</h3>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60">Insight</span>
                    </div>
                    <div className="space-y-6">
                      {result.diagnosis.map((item, idx) => (
                        <div key={idx} className="flex gap-6 items-start group/item">
                          <span className="text-xl font-black text-white/10 group-hover/item:text-white/40 transition-colors">0{idx+1}</span>
                          <p className="text-lg font-medium leading-relaxed text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 方案板块 */}
                {result && (
                  <section className="glass-card rounded-[32px] p-10 bg-gradient-to-br from-white/[0.08] to-transparent">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">优化方案</h3>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(result.optimizedResume);
                          alert('已复制');
                        }}
                        className="text-[10px] font-bold uppercase text-white/40 hover:text-white flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"
                      >
                        <i className="fas fa-copy"></i> Copy
                      </button>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-8 font-mono text-sm leading-loose text-white/60 border border-white/5 shadow-inner whitespace-pre-wrap">
                      {result.optimizedResume}
                    </div>
                  </section>
                )}

                {/* 匹配板块 */}
                {result && (
                  <section className="glass-card rounded-[32px] p-10">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">职位匹配</h3>
                      <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-white' : 'bg-white/10'}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-6">
                      {result.matchingSuggestions.map((item, idx) => (
                        <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6 hover:bg-white/[0.05] transition-all duration-500">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <i className="fas fa-arrow-right text-[10px] text-white/40"></i>
                          </div>
                          <p className="text-sm font-bold text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
>>>>>>> f5896852d5d3cc2eea49229113552b8187814cbb
          </div>
        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-white/20 font-bold text-[11px] uppercase tracking-[0.2em]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <span className="text-[10px]">AI</span>
            </div>
            <span className="text-white/40">Resume.Pro</span>
          </div>
          <div className="flex gap-12">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
          <div>© 2024 DESIGNED BY AI.PRO</div>
        </div>
      </footer>
    </div>
  );
};

export default App;