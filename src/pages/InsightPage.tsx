import { useState, useContext } from 'react';
import { useGenerateMechanismTreeLazyQuery } from '../generated/graphql';
import { MechanismTree } from '../components/MechanismTree';
import { Spin, Alert, message, Typography, Button } from 'antd';
import { SearchOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { ThemeContext } from '@/components/ThemeProvider';

const { Title, Text } = Typography;

const InsightPage = () => {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';
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
      <div className="mb-10">
        <div className="flex justify-between items-start">
          <Text className="block text-indigo-500 font-bold uppercase tracking-[0.2em] text-xs mb-1">
            INTELLIGENCE ENGINE
          </Text>
        </div>
        <div className="flex justify-between items-end">
          <Title level={1} className="!mb-0 !text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            知识洞察
          </Title>
        </div>
        <Text className="text-gray-500 dark:text-gray-400 mt-3 block text-lg font-medium max-w-2xl">
          利用先进 AI 模型，将复杂概念拆解为可交互的知识机制树。
        </Text>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-12">
        <div className="relative group max-w-3xl">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative flex items-center glassy-card rounded-2xl p-1.5 overflow-hidden">
            <SearchOutlined className="text-gray-400 text-xl ml-5 shrink-0" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入一个主题开始探索..." 
              className="flex-1 bg-transparent border-none outline-none ring-0 px-4 py-4 text-xl text-white placeholder-gray-600 font-light w-full min-w-0"
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              loading={loading}
              className="h-14 px-8 rounded-xl bg-white hover:bg-gray-100 border-none text-black font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              立即生成
            </Button>
          </div>
        </div>

        {/* SUGGESTIONS */}
        {!data && !loading && (
          <div className="mt-6 flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {suggestions.map(s => (
              <Button 
                key={s}
                type="text"
                onClick={() => {
                  setQuery(s);
                  generateTree({ variables: { query: s } });
                }}
                className="!h-auto !px-4 !py-1.5 !rounded-full !bg-white/5 hover:!bg-white/10 !border !border-white/5 !text-gray-500 hover:!text-white text-xs backdrop-blur-sm transition-all"
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
