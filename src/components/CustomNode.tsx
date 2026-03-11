import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RocketOutlined, BuildOutlined, DeploymentUnitOutlined } from '@ant-design/icons';

const CustomNode = ({ data }: NodeProps) => {
  const isRoot = data.isRoot;
  const isMechanism = data.isMechanism;

  // Dynamic styles based on node type
  let bgClass = "bg-white dark:bg-slate-800";
  let borderClass = "border-slate-200 dark:border-slate-700";
  let textClass = "text-slate-700 dark:text-slate-200";
  let icon = <BuildOutlined />;
  
  if (isRoot) {
    bgClass = "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30";
    borderClass = "border-transparent";
    textClass = "text-white";
    icon = <RocketOutlined />;
  } else if (isMechanism) {
    bgClass = "bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500";
    textClass = "text-slate-800 dark:text-slate-100";
    icon = <DeploymentUnitOutlined className="text-indigo-500 dark:text-indigo-400" />;
  }

  return (
    <div className={`
      relative min-w-[240px] px-4 py-3 rounded-xl shadow-lg transition-all duration-300
      hover:shadow-xl hover:scale-105 backdrop-blur-md
      border ${borderClass} ${bgClass}
    `}>
      {/* Input Handle */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-slate-400 dark:!bg-slate-500 !-top-1.5"
        />
      )}

      {/* Content */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg opacity-80 ${isRoot ? 'text-white' : ''} `}>
                {icon}
            </span>
            <div className={`font-bold text-sm ${textClass}`}>
                {data.title as string}
            </div>
        </div>
        
        {!!data.active_ingredient && (
          <div className={`
            text-xs mt-1 pt-2 border-t flex items-start gap-1
            ${isRoot ? 'border-white/20 text-indigo-100' : 'border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 italic'}
          `}>
             <span className="opacity-70 not-italic">💡</span>
             <span>{String(data.active_ingredient || '')}</span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 dark:!bg-slate-500 !-bottom-1.5"
      />
    </div>
  );
};

export default memo(CustomNode);
