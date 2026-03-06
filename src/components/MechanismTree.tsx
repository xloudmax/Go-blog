import { useCallback, useMemo, useEffect, useContext } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Position,
  Background,
  Controls,
  Node,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { MechanismNode } from '../generated/graphql';
import CustomNode from './CustomNode';
import { ThemeContext } from './ThemeProvider';

interface MechanismTreeProps {
  data: MechanismNode;
}

const nodeWidth = 260; // Slightly wider for new design
const nodeHeight = 100;

const nodeTypes = {
  custom: CustomNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const flattenTree = (node: MechanismNode, isDarkMode: boolean, parentId?: string): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const isRoot = !parentId;
  const isMechanism = !!(parentId && parentId === 'root'); // Heuristic: direct children of root are mechanisms
  
  // Colors based on theme
  const edgeColor = isDarkMode ? '#818cf8' : '#6366f1'; // Indigo-400 (Dark) vs Indigo-500 (Light)

  const flowNode: Node = {
    id: node.id,
    type: 'custom', // Use our custom node
    data: {
      label: node.label,
      note: node.note,
      isRoot,
      isMechanism,
    },
    position: { x: 0, y: 0 },
    // no style/className here, CustomNode handles it
  };

  nodes.push(flowNode);

  if (parentId) {
    edges.push({
      id: `${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: 'smoothstep', 
      animated: true,
      interactionWidth: 20, // Better hover interaction
      style: { stroke: edgeColor, strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
    });
  }

  if (node.children) {
    node.children.forEach((child) => {
      // If parent is root, then children are mechanisms. 
      // If parent is mechanism, children are solutions.
      // We pass this info down? No need, flattenTree is recursive.
      // But we need to know the 'depth' or type for styling.
      const { nodes: childNodes, edges: childEdges } = flattenTree(child, isDarkMode, node.id);
      nodes.push(...childNodes);
      edges.push(...childEdges);
    });
  }

  return { nodes, edges };
};

export const MechanismTree = ({ data }: MechanismTreeProps) => {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';

  // Initial layout calculation
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const { nodes, edges } = flattenTree(data, isDarkMode);
    return getLayoutedElements(nodes, edges);
  }, [data, isDarkMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when data changes (Critical Fix)
  useEffect(() => {
      const { nodes: newNodes, edges: newEdges } = flattenTree(data, isDarkMode);
      const layouted = getLayoutedElements(newNodes, newEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
  }, [data, isDarkMode, setNodes, setEdges]); // Depend on data and setters

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full min-h-[600px] bg-transparent backdrop-blur-sm transition-colors duration-300">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ duration: 800, padding: 0.2 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 [&>button]:!border-b-slate-200 dark:[&>button]:!border-b-slate-700 [&_svg]:!fill-slate-600 dark:[&_svg]:!fill-slate-300 shadow-md !m-4" />
        <Background 
            color={isDarkMode ? "#cbd5e1" : "#94a3b8"} // Slate-300 vs Slate-400
            gap={24} 
            size={1} 
            variant={BackgroundVariant.Dots} 
            className="opacity-20" 
        />
      </ReactFlow>
    </div>
  );
};
