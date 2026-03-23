import { useState, useOptimistic, useTransition } from 'react';
import { MechanismTree } from '../components/MechanismTree';
import { ExtendedMechanismNode } from '../types';
import { Alert, Typography, App } from 'antd';
import { LiquidButton } from '../components/LiquidButton';
import { DeploymentUnitOutlined } from '@ant-design/icons';
// import { ThemeContext } from '@/components/ThemeProvider';
import { LiquidSearchBox } from '../components/LiquidSearchBox';
import { PageHeader } from '../components/PageHeader';
import { PageContainer } from '../components/PageContainer';
import MarkdownViewer from '../components/MarkdownViewer';

const { Text } = Typography;

const InsightPage = () => {
  const { message } = App.useApp();
  // const { theme } = useContext(ThemeContext);

  const [query, setQuery] = useState('');
  const [graphData, setGraphData] = useState<ExtendedMechanismNode | null>(null);
  const [isGraphRAG, setIsGraphRAG] = useState(false);
  const [searchMode, setSearchMode] = useState<'local' | 'global'>('local');
  const [globalAnswer, setGlobalAnswer] = useState<string | null>(null);
  
  // const [generateTree, { loading: genLoading, error: genError }] = useGenerateMechanismTreeLazyQuery({
  //   fetchPolicy: 'network-only',
  //   onCompleted: (data) => {
  //     if (data?.generateMechanismTree) {
  //       setGraphData(data.generateMechanismTree as ExtendedMechanismNode);
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
      } as ExtendedMechanismNode;
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
        body: JSON.stringify({ query, max_hops: 3 }), // Increased to 3 for better depth
      });

      if (response.ok) {
        const result = await response.json();
        if (result.nodes && result.nodes.length > 0) {
          // Map to format expected by rebuildTree
          const formattedNodes = result.nodes.map((n: { id: string; name: string; description: string; community_id: number }) => ({
            id: n.id,
            community_id: n.community_id,
            data: { label: n.name, active_ingredient: n.description }
          }));
          const formattedEdges = result.edges.map((e: { source_id: string; target_id: string }) => ({
            source: e.source_id,
            target: e.target_id
          }));

          const fullTree = rebuildTree(formattedNodes, formattedEdges);
          if (fullTree) {
            setGraphData(fullTree);
            setIsGraphRAG(true);
            return;
          }
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
                  community_id: undefined,
                  children: []
                } as ExtendedMechanismNode);
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
  const rebuildTree = (nodes: Record<string, any>[], edges: Record<string, any>[]): ExtendedMechanismNode | null => {

    if (nodes.length === 0) return null;
    
    const nodeMap = new Map<string, ExtendedMechanismNode>();
    const hasParent = new Set<string>();

    // 1. Initialize all nodes
    nodes.forEach(n => {
      nodeMap.set(n.id, {
        id: n.id,
        title: n.data?.label || n.title || 'Untitled',
        active_ingredient: n.data?.active_ingredient || n.active_ingredient || '',
        community_id: n.community_id, // Pass the community ID
        applications: n.applications || n.data?.applications || [], // Pass applications
        children: []
      });
    });

    // 2. Build relationships
    edges.forEach(e => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target && source.id !== target.id) {
        if (!source.children) source.children = [];
        // Avoid duplicate children
        if (!source.children.some((c: ExtendedMechanismNode) => c.id === target.id)) {
          source.children.push(target);
          hasParent.add(target.id);
        }
      }
    });

    // 3. Create a Virtual Root to hold all entry points
    const virtualRoot: ExtendedMechanismNode = {
      id: 'virtual-root',
      title: 'Knowledge Inference',
      active_ingredient: 'Synthesized from multiple sources',
      children: []
    };

    // 4. Any node that doesn't have a parent is a root-level node
    nodeMap.forEach(node => {
      if (!hasParent.has(node.id)) {
        virtualRoot.children?.push(node);
      }
    });

    // 5. Fallback: if somehow everything has a parent (cycle), pick the first node
    if (virtualRoot.children?.length === 0 && nodes.length > 0) {
        const firstNode = nodeMap.values().next().value;
        if (firstNode) virtualRoot.children?.push(firstNode);
    }

    return virtualRoot;
  };

  const loading = genLoading || ragLoading;
  const error = genError || (ragError ? { message: ragError } : null);

  return (
    <PageContainer>
      {/* COMPACT TOP BAR: Title + Search Mode + Search Box */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <PageHeader 
            label="INTELLIGENCE ENGINE"
            title="知识洞察"
            className="!mb-0"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 max-w-2xl justify-end">
          {/* SEARCH MODE SWITCH - Flat */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 h-10 shrink-0">
            <button
              onClick={() => setSearchMode('local')}
              className={`px-4 py-1 rounded-lg text-[10px] font-bold transition-all ${
                searchMode === 'local' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              LOCAL
            </button>
            <button
              onClick={() => setSearchMode('global')}
              className={`px-4 py-1 rounded-lg text-[10px] font-bold transition-all ${
                searchMode === 'global' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              GLOBAL
            </button>
          </div>

          {/* SEARCH BOX & BUTTON - Separated for stability */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-[48px]">
              <LiquidSearchBox
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                placeholder={searchMode === 'local' ? "局部探索特定的逻辑演化..." : "输入宏观问题提炼..."}
                containerClassName="w-full h-full"
                height={48}
                width="100%"
                scale={3}
                bezelWidth={4}
                refractiveIndex={1.4}
                specularOpacity={0.6}
                blur={0}
                disabled={loading}
                inputClassName="px-5 text-sm font-medium"
              />
            </div>
            <LiquidButton
              onClick={handleSearch}
              loading={loading}
              variant="primary"
              bezelWidth={4}
              refractiveIndex={1.5}
              specularOpacity={0.8}
              className={`!h-[48px] !min-h-[48px] !rounded-xl !px-8 !text-[10px] font-black tracking-widest transition-all ${
                searchMode === 'global' ? 'shadow-purple-500/20 bg-purple-600/20' : 'shadow-blue-500/20 bg-blue-600/20'
              }`}
            >
              EXPLORE
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* CONTENT AREA - Clean & Maximized */}
      {(optimisticGraph || globalAnswer) && (
        <div className={`relative w-full transition-all duration-700 ${
          (optimisticGraph || globalAnswer) ? 'min-h-[80vh]' : 'h-0 opacity-0'
        }`}>
          {/* BADGE - Minimalist */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-2 pointer-events-none">
            <div className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase backdrop-blur-md border ${
              isGraphRAG 
                ? (searchMode === 'global' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400/70' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70')
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400/70'
            }`}>
              {isGraphRAG 
                ? (searchMode === 'global' ? 'Global Analysis' : 'Local Graph') 
                : 'Synthetic Inference'}
            </div>
          </div>

          {/* TREE VIEW - Borderless & Expanded */}
          {(optimisticGraph || isPending) && !globalAnswer && (
            <div className={`h-[80vh] relative transition-all duration-1000 ${isPending ? 'opacity-50 grayscale' : 'opacity-100 grayscale-0'}`}>
               {optimisticGraph && <MechanismTree data={optimisticGraph} />}
            </div>
          )}

          {/* GLOBAL ANSWER VIEW - Focused Typography */}
          {globalAnswer && (
            <div className="py-10 md:py-16 max-w-4xl mx-auto animate-fade-in bg-white/2 rounded-[24px] border border-white/5 px-8 md:px-12">
              <div className="prose prose-invert prose-lg max-w-none">
                <Text className="text-gray-500 uppercase tracking-widest text-[10px] mb-6 block font-bold">BioSpark Synthesis</Text>
                <MarkdownViewer content={globalAnswer} />
              </div>
            </div>
          )}
        </div>
      )}

    {/* EMPTY STATE - Less Padded */}
    {!optimisticGraph && !globalAnswer && !loading && !isPending && (
      <div className="py-16 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/5 mx-auto max-w-xl">
        <DeploymentUnitOutlined className="text-3xl text-gray-700 mb-6" />
        <p className="text-gray-600 text-sm font-light tracking-widest uppercase">
          {searchMode === 'local' ? "Decompose functional mechanisms" : "Inquire for macro analogies"}
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
