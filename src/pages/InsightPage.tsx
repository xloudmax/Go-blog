import { useState, useOptimistic, useTransition } from 'react';
import { MechanismNode } from '../generated/graphql';
import { MechanismTree } from '../components/MechanismTree';
import { Alert, message, Typography, Grid } from 'antd';
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
  const [searchMode, setSearchMode] = useState<'local' | 'global'>('local');
  const [globalAnswer, setGlobalAnswer] = useState<string | null>(null);
  const [isBuildingCommunities, setIsBuildingCommunities] = useState(false);
  
  // const [generateTree, { loading: genLoading, error: genError }] = useGenerateMechanismTreeLazyQuery({
  //   fetchPolicy: 'network-only',
  //   onCompleted: (data) => {
  //     if (data?.generateMechanismTree) {
  //       setGraphData(data.generateMechanismTree as MechanismNode);
  //       setIsGraphRAG(false);
  //       setGlobalAnswer(null);
  //     }
  //   }
  // });
  const genLoading = false;
  const genError = null;

  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // useOptimistic for "BioSpark" instant feel
  const [optimisticGraph, setOptimisticGraph] = useOptimistic(
    graphData,
    (state, newQuery: string) => {
      if (!newQuery) return state;
      return {
        id: 'optimistic-root',
        title: `Exploring: ${newQuery}...`,
        active_ingredient: 'BioSpark Inference Engine Active',
        children: []
      } as MechanismNode;
    }
  );

  const handleSearch = async () => {
    if (!query.trim()) {
      message.warning('请输入想要探索的主题！');
      return;
    }

    setRagLoading(true);
    setRagError(null);
    setGlobalAnswer(null);

    startTransition(() => {
        setOptimisticGraph(query);
    });

    try {
      if (searchMode === 'global') {
        setRagLoading(true);
        const response = await fetch('/api/graph/global-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (response.ok) {
          const result = await response.json();
          setGlobalAnswer(result.answer);
          setIsGraphRAG(true);
          setGraphData(null); // Clear for global text answer
        } else {
          throw new Error('Global search failed');
        }
        setRagLoading(false);
        return;
      }

      // Local Search Logic - Try GraphRAG first
      const response = await fetch('/api/graph/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_hops: 2 }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.results && result.results.length > 0) {
          const root: MechanismNode = {
            id: 'rag-root',
            title: `Search: ${query}`,
            active_ingredient: 'Found in Knowledge Graph',
            children: result.results.map((r: { id: string; name: string; description: string }) => ({
              id: r.id,
              title: r.name,
              active_ingredient: r.description,
              children: []
            }))
          };
          setGraphData(root);
          setIsGraphRAG(true);
          return;
        }
      }
      
      // Fallback to STREAMING generation
      setIsGraphRAG(false);
      setRagLoading(true);
      const streamResponse = await fetch('/api/graph/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!streamResponse.ok) throw new Error('Streaming failed');
      if (!streamResponse.body) throw new Error('No body in stream');

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const discoveredNodes: Record<string, unknown>[] = [];
      const discoveredEdges: Record<string, unknown>[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.slice(6).trim();
            if (dataStr === '[DONE]') break;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'metadata') {
                setGraphData({
                  id: 'root',
                  title: event.root_mechanism,
                  active_ingredient: 'Generating hierarchy...',
                  children: []
                });
              } else if (event.type === 'node') {
                discoveredNodes.push(event.data);
                setGraphData(rebuildTree(discoveredNodes, discoveredEdges));
              } else if (event.type === 'edge') {
                discoveredEdges.push(event.data);
                setGraphData(rebuildTree(discoveredNodes, discoveredEdges));
              }
            } catch {
              // Ignore partial parse
            }
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search error:', err);
      setRagError('搜索过程中出现错误，请稍后再试。');
    } finally {
      setRagLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rebuildTree = (nodes: Record<string, any>[], edges: Record<string, any>[]): MechanismNode | null => {
    if (nodes.length === 0) return null;
    
    const nodeMap = new Map<string, MechanismNode>();
    nodes.forEach(n => {
      nodeMap.set(n.id, {
        id: n.id,
        title: n.data.label || n.title,
        active_ingredient: n.data.active_ingredient || n.active_ingredient,
        children: []
      });
    });

    let root: MechanismNode | null = null;
    
    // Find root (usually the one with ID 'root' or first one)
    root = nodeMap.get('root') || nodeMap.values().next().value || null;

    edges.forEach(e => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target) {
        // Avoid duplicate children
        if (!source.children) source.children = [];
        if (!source.children.some(c => c.id === target.id)) {
          source.children.push(target);
        }
      }
    });

    return root;
  };

  const handleBuildCommunities = async () => {
    setIsBuildingCommunities(true);
    try {
      const response = await fetch('/api/graph/build-communities', { method: 'POST' });
      if (response.ok) {
        message.success('已触发图谱社区构建（后台运行中）');
      } else {
        message.error('触发失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setIsBuildingCommunities(false);
    }
  };

  const loading = genLoading || ragLoading;
  const error = genError || (ragError ? { message: ragError } : null);

  const suggestions = [
    "前端架构在过去一年的演变",
    "React Hooks 生命周期",
    "Transformer 模型架构",
    "Docker 容器化原理",
    "TCP/IP 三次握手"
  ];

  return (
    <PageContainer>
      <PageHeader 
        label="INTELLIGENCE ENGINE"
        title="知识洞察"
      />

      <div className="absolute top-10 right-10 z-30">
        <LiquidButton
          onClick={handleBuildCommunities}
          loading={isBuildingCommunities}
          className="!h-10 !px-4 !rounded-xl !bg-white/5 !text-[10px] !text-gray-500 hover:!text-white tracking-widest uppercase border border-white/5"
          variant="secondary"
        >
          Rebuild Graph Communities
        </LiquidButton>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-10 md:mb-12">
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => setSearchMode('local')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                searchMode === 'local' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              局部探索 (Local)
            </button>
            <button
              onClick={() => setSearchMode('global')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                searchMode === 'global' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              全局意义构建 (Global)
            </button>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto flex flex-col md:block gap-4">
          <LiquidSearchBox
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            placeholder={searchMode === 'local' ? "输入特定主题进行多跳探索..." : "提出一个宏观问题，如“前端架构如何演进？”"}
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
              className={`!h-14 w-full md:w-auto px-8 !rounded-2xl text-lg font-bold shadow-xl z-20 ${
                searchMode === 'global' ? 'shadow-purple-500/10' : 'shadow-blue-500/10'
              }`}
            >
              {searchMode === 'global' ? '全域分析' : '立即生成'}
            </LiquidButton>
          </div>
        </div>

      {/* SUGGESTIONS */}
      {!optimisticGraph && !globalAnswer && !loading && !isPending && (
        <div className="mt-8 flex justify-center flex-wrap gap-2 md:gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
      {(optimisticGraph || globalAnswer) && (
        <div className={`relative w-full rounded-[32px] overflow-hidden border border-white/10 transition-all duration-700 ${
          (optimisticGraph || globalAnswer) ? 'min-h-[60vh] bg-black/20 shadow-2xl' : 'h-0 opacity-0'
        }`}>
          {/* BADGE */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md border ${
              isGraphRAG 
                ? (searchMode === 'global' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400')
                : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
            }`}>
              {isGraphRAG 
                ? (searchMode === 'global' ? 'Global Community Analysis' : 'GraphRAG Local Retrieval') 
                : 'AI Dynamic Synthesis'}
            </div>
          </div>

          {/* TREE VIEW */}
          {(optimisticGraph || isPending) && !globalAnswer && (
            <div className={`h-[75vh] relative animate-scale-in transition-all duration-1000 ${isPending ? 'opacity-50 grayscale' : 'opacity-100 grayscale-0'}`}>
               {/* BIO-SPARK HUD */}
               <div className="absolute top-2 right-12 z-20 pointer-events-none">
                  <div className="flex flex-col items-end gap-1">
                      <div className="text-[8px] tracking-[4px] text-indigo-400/50 uppercase font-black">BioSpark Pulse</div>
                      <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`w-1 h-3 rounded-full ${loading || isPending ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500/20'}`} style={{ animationDelay: `${i*0.1}s` }} />
                          ))}
                      </div>
                  </div>
               </div>
               {optimisticGraph && <MechanismTree data={optimisticGraph} />}
            </div>
          )}

          {/* GLOBAL ANSWER VIEW */}
          {globalAnswer && (
            <div className="p-12 md:p-20 max-w-4xl mx-auto animate-fade-in">
              <div className="prose prose-invert prose-lg max-w-none">
                <Text className="text-gray-400 uppercase tracking-widest text-xs mb-4 block">Analysis Result</Text>
                <div className="text-white leading-relaxed whitespace-pre-wrap text-lg font-light italic">
                  {globalAnswer}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    {/* EMPTY STATE */}
    {!optimisticGraph && !globalAnswer && !loading && !isPending && (
      <div className="py-24 flex flex-col items-center justify-center glassy-card rounded-[40px] border-dashed border-white/10 mx-auto max-w-2xl">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
          <DeploymentUnitOutlined className="text-4xl text-gray-600" />
        </div>
        <p className="text-gray-500 text-xl font-light tracking-wide text-center">
          {searchMode === 'local' 
            ? "选择或输入一个特定主题，查看其演化的机制树" 
            : "提出一个宏观、跨领域的问题，系统将从各知识社区中提炼答案"}
        </p>
      </div>
    )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-t-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-b-2 border-purple-500 animate-spin-slow"></div>
            </div>
          </div>
          <Text className="mt-8 text-white/70 font-bold tracking-[0.2em] uppercase text-xs">
            {searchMode === 'global' ? '提炼全域知识社区' : 'AI 正在构建知识图谱'}
          </Text>
        </div>
      )}

      {/* ERROR HANDLING */}
      {error && (
        <div className="mt-10 max-w-3xl mx-auto">
          <Alert
            message="执行失败"
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
