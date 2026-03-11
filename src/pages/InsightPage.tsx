import { useState } from 'react';
import { useGenerateMechanismTreeLazyQuery, MechanismNode } from '../generated/graphql';
import { MechanismTree } from '../components/MechanismTree';
import { Spin, Alert, message, Typography, Grid } from 'antd';
import { LiquidButton } from '../components/LiquidButton';
import { DeploymentUnitOutlined } from '@ant-design/icons';
// import { ThemeContext } from '@/components/ThemeProvider';
import { LiquidSearchBox } from '../components/LiquidSearchBox';
import { PageHeader } from '../components/PageHeader';
import { PageContainer } from '../components/PageContainer';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const InsightPage = () => {
  // const { theme } = useContext(ThemeContext);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [query, setQuery] = useState('');
  const [graphData, setGraphData] = useState<MechanismNode | null>(null);
  const [isGraphRAG, setIsGraphRAG] = useState(false);
  
  const [generateTree, { loading: genLoading, error: genError }] = useGenerateMechanismTreeLazyQuery({
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.generateMechanismTree) {
        setGraphData(data.generateMechanismTree as MechanismNode);
        setIsGraphRAG(false);
      }
    }
  });

  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      message.warning('请输入想要探索的主题！');
      return;
    }

    setRagLoading(true);
    setRagError(null);
    setGraphData(null);

    try {
      // 1. Try GraphRAG Search First
      const response = await fetch('/api/graph/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_hops: 2 }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.results && result.results.length > 0) {
          // Convert GraphRAG results to MechanismNode structure
          // This is a heuristic conversion for the tree view
          const root: MechanismNode = {
            id: 'rag-root',
            title: `Search: ${query}`,
            active_ingredient: 'Knowledge Graph Retrieval',
            children: result.results.map((r: any) => ({
              id: r.id,
              title: r.name,
              active_ingredient: r.description,
              children: []
            }))
          };
          setGraphData(root);
          setIsGraphRAG(true);
          setRagLoading(false);
          return;
        }
      }
      
      // 2. Fallback to Dynamic Generation if no graph data found
      generateTree({ variables: { query } });
    } catch (err) {
      console.error('GraphRAG error, falling back to Gen:', err);
      generateTree({ variables: { query } });
    } finally {
      setRagLoading(false);
    }
  };

  const loading = genLoading || ragLoading;
  const error = genError || (ragError ? { message: ragError } : null);

  const suggestions = [
    "React Hooks 生命周期",
    "比特币工作量证明",
    "Transformer 模型架构",
    "TCP/IP 三次握手",
    "Docker 容器化原理"
  ];

  return (
    <PageContainer>
      <PageHeader 
        label="INTELLIGENCE ENGINE"
        title="知识洞察"
      />

      {/* SEARCH BAR */}
      <div className="mb-10 md:mb-12">
        <div className="relative max-w-3xl flex flex-col md:block gap-4">
          <LiquidSearchBox
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            placeholder={isMobile ? "输入主题..." : "输入一个主题开始探索..."}
            containerClassName="w-full"
            height={isMobile ? 54 : 72}
            width="100%"
            scale={isMobile ? 3 : 4}
            bezelWidth={isMobile ? 5 : 7}
            refractiveIndex={1.5}
            specularOpacity={0.6}
            blur={0}
            disabled={loading}
            inputClassName="px-6 md:px-10 text-base md:text-lg"
            className="flex items-center"
          />
          <div className="static md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 flex gap-2 w-full md:w-auto">
            <LiquidButton
              onClick={handleSearch}
              loading={loading}
              variant="primary"
              className="!h-14 w-full md:w-auto px-8 !rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/10 z-20"
            >
              立即生成
            </LiquidButton>
          </div>
        </div>

      {/* SUGGESTIONS */}
      {!graphData && !loading && (
        <div className="mt-6 flex flex-wrap gap-2 md:gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {suggestions.map(s => (
            <LiquidButton 
              key={s}
              onClick={() => {
                setQuery(s);
                handleSearch();
              }}
              className="!h-auto !px-4 md:!px-5 !py-2 md:!py-1.5 !rounded-full !bg-white/5 hover:!bg-white/10 !border !border-white/5 !text-gray-500 hover:!text-white text-[11px] md:text-xs backdrop-blur-sm transition-all shadow-sm"
              variant="secondary"
            >
              {s}
            </LiquidButton>
          ))}
        </div>
      )}
    </div>

      {/* CONTENT AREA */}
      <div className={`relative w-full rounded-[32px] overflow-hidden border border-white/10 transition-all duration-700 ${
        graphData ? 'h-[75vh] bg-black/20 shadow-2xl' : 'h-0 opacity-0'
      }`}>
        {graphData && (
          <>
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md border ${
                isGraphRAG 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
              }`}>
                {isGraphRAG ? 'GraphRAG Retrieval' : 'AI Dynamic Synthesis'}
              </div>
            </div>
            <MechanismTree data={graphData} />
          </>
        )}
      </div>

    {/* EMPTY STATE */}
    {!graphData && !loading && (
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
    </PageContainer>
  );
};

export default InsightPage;
