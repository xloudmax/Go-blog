import { useState } from 'react';
import { useGenerateMechanismTreeLazyQuery } from '../generated/graphql';
import { MechanismTree } from '../components/MechanismTree';
import { Spin, Alert, message, Typography, Button } from 'antd';
import { DeploymentUnitOutlined } from '@ant-design/icons';
// import { ThemeContext } from '@/components/ThemeProvider';
import { LiquidSearchBox } from '../components/LiquidSearchBox';

const { Title, Text } = Typography;

const InsightPage = () => {
  // const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState('');
  const [generateTree, { data, loading, error }] = useGenerateMechanismTreeLazyQuery({
    fetchPolicy: 'network-only',
  });

  const handleSearch = () => {
    if (!query.trim()) {
      message.warning('请输入想要探索的主题！');
      return;
    }
    generateTree({ variables: { query } });
  };

  const suggestions = [
    "React Hooks 生命周期",
    "比特币工作量证明",
    "Transformer 模型架构",
    "TCP/IP 三次握手",
    "Docker 容器化原理"
  ];

  return (
    <div className="w-full max-w-[2400px] mx-auto py-8 px-2 md:px-6 animate-fade-in-up">
      
      {/* HEADER SECTION */}
      <div className="mb-8 md:mb-10">
        <div className="flex justify-between items-start">
          <Text className="block text-indigo-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mb-1">
            INTELLIGENCE ENGINE
          </Text>
        </div>
        <div className="flex justify-between items-end">
          <Title level={1} className="!mb-0 !text-3xl md:!text-5xl font-extrabold tracking-tight leading-tight md:leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            知识洞察
          </Title>
        </div>
        <Text className="text-gray-500 dark:text-gray-400 mt-3 block text-base md:text-lg font-medium max-w-2xl leading-relaxed">
          利用先进 AI 模型，将复杂概念拆解为可交互的知识机制树。
        </Text>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-10 md:mb-12">
        <div className="relative max-w-3xl flex flex-col md:block gap-4">
          <LiquidSearchBox
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            placeholder={window.innerWidth < 640 ? "输入主题..." : "输入一个主题开始探索..."}
            containerClassName="w-full"
            height={window.innerWidth < 640 ? 64 : 72}
            width="100%"
            scale={4}
            bezelWidth={7}
            refractiveIndex={1.5}
            specularOpacity={0.6}
            blur={0}
            disabled={loading}
            inputClassName="px-6 md:px-10 text-base md:text-lg"
            className="flex items-center"
          />
          <div className="static md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 flex gap-2 w-full md:w-auto">
            <Button
              onClick={handleSearch}
              loading={loading}
              className="h-14 md:h-14 w-full md:w-auto px-8 rounded-xl bg-slate-900 dark:bg-white/90 hover:bg-black dark:hover:bg-white border-none text-white dark:text-black font-bold text-lg shadow-lg hover:scale-[1.01] active:scale-95 transition-all z-20"
            >
              立即生成
            </Button>
          </div>
        </div>

        {/* SUGGESTIONS */}
        {!data && !loading && (
          <div className="mt-6 flex flex-wrap gap-2 md:gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {suggestions.map(s => (
              <Button 
                key={s}
                type="text"
                onClick={() => {
                  setQuery(s);
                  generateTree({ variables: { query: s } });
                }}
                className="!h-auto !px-4 md:!px-5 !py-2 md:!py-1.5 !rounded-full !bg-white/5 hover:!bg-white/10 !border !border-white/5 !text-gray-500 hover:!text-white text-[11px] md:text-xs backdrop-blur-sm transition-all shadow-sm"
              >
                {s}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className={`relative w-full rounded-[32px] overflow-hidden border border-white/10 transition-all duration-700 ${
        data?.generateMechanismTree ? 'h-[75vh] bg-black/20 shadow-2xl' : 'h-0 opacity-0'
      }`}>
        {data?.generateMechanismTree && (
          <MechanismTree data={data.generateMechanismTree} />
        )}
      </div>

      {/* EMPTY STATE */}
      {!data && !loading && (
        <div className="py-20 flex flex-col items-center justify-center glassy-card rounded-[40px] border-dashed border-white/10">
          <DeploymentUnitOutlined className="text-6xl text-gray-700 mb-6" />
          <p className="text-gray-500 text-xl font-light tracking-wide">
            您的知识地图将在此处呈现
          </p>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center">
          <Spin size="large" />
          <Text className="mt-6 text-white/70 font-light tracking-widest uppercase text-sm">
            AI 正在构建知识图谱
          </Text>
        </div>
      )}

      {/* ERROR HANDLING */}
      {error && (
        <div className="mt-10 max-w-3xl">
          <Alert
            message="生成失败"
            description={error.message}
            type="error"
            showIcon
            className="bg-red-950/20 border-red-500/10 rounded-2xl py-4 text-red-200"
          />
        </div>
      )}
    </div>
  );
};

export default InsightPage;
