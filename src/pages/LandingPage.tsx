import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button, Space, Typography} from 'antd';
import {LoginOutlined, UserAddOutlined} from '@ant-design/icons';

const { Title } = Typography;

interface Cell {
  x: number;
  y: number;
  alive: boolean;
  justBorn?: boolean;
  justDied?: boolean;
}

interface MouseTrailPoint {
  x: number;
  y: number;
  opacity: number;
  timestamp: number;
}

const LandingPage: React.FC = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // GameOfLife 状态
  const [cells, setCells] = useState<Cell[][]>([]);

  // 鼠标轨迹状态
  const [mouseTrail, setMouseTrail] = useState<MouseTrailPoint[]>([]);

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMousePosRef = useRef({ x: -1, y: -1 });
  const mouseThrottleRef = useRef<number>(0);
  const trailAnimationRef = useRef<number>(0);
  const cellSize = 8;
  const fps = 8; // 降低帧率，提升流畅度

  // 缓存网格尺寸
  const gridDimensions = useMemo(() => ({
    cols: Math.ceil(windowSize.width / cellSize),
    rows: Math.ceil(windowSize.height / cellSize)
  }), [windowSize.width, windowSize.height]);

  // 防抖窗口大小变化
  const debouncedResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 150);
    };
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = debouncedResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debouncedResize]);

  // 初始化细胞网格
  useEffect(() => {
    const initialCells: Cell[][] = [];
    const { cols, rows } = gridDimensions;

    for (let x = 0; x < cols; x++) {
      const column: Cell[] = [];
      for (let y = 0; y < rows; y++) {
        column.push({ x, y, alive: false });
      }
      initialCells.push(column);
    }

    // 添加简单的初始模式
    addInitialPatterns(initialCells);
    setCells(initialCells);
  }, [gridDimensions]);

  // 鼠标轨迹动画循环
  useEffect(() => {
    const updateTrail = () => {
      setMouseTrail(prevTrail =>
        prevTrail
          .map(point => ({
            ...point,
            opacity: Math.max(0, point.opacity - 0.05) // 逐渐淡出
          }))
          .filter(point => point.opacity > 0) // 移除完全透明的点
      );
      trailAnimationRef.current = requestAnimationFrame(updateTrail);
    };

    trailAnimationRef.current = requestAnimationFrame(updateTrail);

    return () => {
      if (trailAnimationRef.current) {
        cancelAnimationFrame(trailAnimationRef.current);
      }
    };
  }, []);

  // 添加初始模式
  const addInitialPatterns = useCallback((cells: Cell[][]) => {
    if (cells.length === 0 || cells[0].length === 0) return;

    const centerX = Math.floor(cells.length / 2);
    const centerY = Math.floor(cells[0].length / 2);

    // 简化初始模式，减少计算负担
    const patterns = [
      // 滑翔机
      { offsetX: -15, offsetY: -15, pattern: [
        { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
      ]},
      { offsetX: 15, offsetY: 15, pattern: [
        { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
      ]},
      // 振荡器
      { offsetX: 0, offsetY: 0, pattern: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
      ]}
    ];

    patterns.forEach(({ offsetX, offsetY, pattern }) => {
      pattern.forEach(({ x, y }) => {
        const posX = centerX + x + offsetX;
        const posY = centerY + y + offsetY;
        if (posX >= 0 && posX < cells.length && posY >= 0 && posY < cells[0].length) {
          cells[posX][posY].alive = true;
          cells[posX][posY].justBorn = true;
        }
      });
    });

    // 减少随机细胞数量
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * Math.min(30, cells.length));
      const y = Math.floor(Math.random() * Math.min(30, cells[0].length));
      if (x < cells.length && y < cells[0].length) {
        cells[x][y].alive = true;
        cells[x][y].justBorn = true;
      }
    }
  }, []);

  // 简化的生命游戏计算
  const calculateNextGeneration = useCallback((currentCells: Cell[][]) => {
    const cols = currentCells.length;
    const rows = currentCells[0]?.length || 0;

    const newCells = currentCells.map(column =>
      column.map(cell => ({
        ...cell,
        justBorn: false,
        justDied: false
      }))
    );

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // 计算邻居数量
        let neighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (
              nx >= 0 &&
              nx < cols &&
              ny >= 0 &&
              ny < rows &&
              currentCells[nx][ny].alive
            ) {
              neighbors++;
            }
          }
        }

        // 应用生命游戏规则
        if (currentCells[x][y].alive) {
          if (neighbors < 2 || neighbors > 3) {
            newCells[x][y].alive = false;
            newCells[x][y].justDied = true;
          }
        } else {
          if (neighbors === 3) {
            newCells[x][y].alive = true;
            newCells[x][y].justBorn = true;
          }
        }
      }
    }

    return newCells;
  }, []);

  // 简化的Canvas渲染（包含鼠标轨迹）
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // 轻微拖尾效果
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 渲染生命游戏细胞
    cells.forEach(column => {
      column.forEach(cell => {
        if (cell.alive) {
          const x = cell.x * cellSize;
          const y = cell.y * cellSize;

          // 根据状态设置颜色
          if (cell.justBorn) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
          } else if (cell.justDied) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
          } else {
            ctx.fillStyle = 'rgba(124, 58, 237, 0.8)';
          }

          ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
        }
      });
    });

    // 渲染鼠标轨迹
    mouseTrail.forEach((point, index) => {
      const size = 4 - (index * 0.5); // 点的大小递减
      if (size > 0) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${point.opacity})`;
        ctx.fill();
      }
    });
  }, [cells, cellSize, mouseTrail]);

  // 游戏循环
  useEffect(() => {
    if (cells.length === 0) return;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastTimeRef.current >= 1000 / fps) {
        setCells(prevCells => calculateNextGeneration(prevCells));
        lastTimeRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cells.length, calculateNextGeneration]);

  // 渲染循环
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 创建细胞
  const createCell = useCallback((gridX: number, gridY: number) => {
    if (gridX >= 0 && gridX < cells.length && gridY >= 0 && gridY < cells[0].length) {
      setCells(prevCells => {
        const newCells = [...prevCells];
        if (newCells[gridX] && newCells[gridX][gridY] && !newCells[gridX][gridY].alive) {
          newCells[gridX] = [...newCells[gridX]];
          newCells[gridX][gridY] = {
            ...newCells[gridX][gridY],
            alive: true,
            justBorn: true,
            justDied: false
          };
        }
        return newCells;
      });
    }
  }, [cells]);

  // 更新鼠标轨迹
  const updateMouseTrail = useCallback((x: number, y: number) => {
    const now = Date.now();
    setMouseTrail(prevTrail => {
      return [
        {x, y, opacity: 1, timestamp: now},
        ...prevTrail.slice(0, 8) // 保持最多9个点（包括新点）
      ];
    });
  }, []);

  // 鼠标移动创建细胞并更新轨迹
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = Date.now();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 更新鼠标轨迹（高频率）
    updateMouseTrail(x, y);

    // 创建细胞（低频率，节流）
    if (now - mouseThrottleRef.current >= 50) {
      mouseThrottleRef.current = now;

      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);

      // 避免重复创建
      if (lastMousePosRef.current.x !== gridX || lastMousePosRef.current.y !== gridY) {
        lastMousePosRef.current = { x: gridX, y: gridY };
        createCell(gridX, gridY);
      }
    }
  }, [createCell, updateMouseTrail]);

  // 点击创建细胞
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);
    createCell(gridX, gridY);
  }, [createCell]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Canvas生命游戏背景 */}
      <canvas
        ref={canvasRef}
        width={windowSize.width}
        height={windowSize.height}
        className="absolute inset-0 z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          imageRendering: 'pixelated',
          cursor: 'default' // 使用默认指针而不是十字
        }}
      />

      {/* 轻微的渐变遮罩层 */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(99, 102, 241, 0.01) 50%, rgba(168, 85, 247, 0.02) 100%)'
        }}
      />

      {/* 内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none">
        {/* 品牌标识 - 像素艺术风格 */}
        <div className="mb-12 animate-fade-in">
          {/* 像素风格标题 */}
          <div className="relative">
            <Title
              level={1}
              className="text-white mb-4 animate-pulse"
              style={{
                fontSize: '4rem',
                fontFamily: 'monospace, "Courier New", Courier',
                fontWeight: 'bold',
                letterSpacing: '0.2em',
                textShadow: `
                  0 0 10px rgba(99, 102, 241, 1),
                  0 0 20px rgba(99, 102, 241, 0.8),
                  0 0 30px rgba(124, 58, 237, 0.6),
                  2px 2px 0px rgba(99, 102, 241, 0.8),
                  4px 4px 0px rgba(124, 58, 237, 0.6),
                  6px 6px 0px rgba(168, 85, 247, 0.4)
                `,
                background: 'linear-gradient(45deg, #6366f1, #7c3aed, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                imageRendering: 'pixelated'
              }}
            >C404
            </Title>
            {/* 像素装饰线条 */}
            <div className="flex justify-center space-x-1 mb-2">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    imageRendering: 'pixelated'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* 像素风格认证按钮 */}
        <div className="animate-fade-in-up pointer-events-auto">
          <Space size="large" className="flex flex-col sm:flex-row">
            {/* 登录按钮 - 像素风格 */}
            <Link to="/login">
              <div
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  imageRendering: 'pixelated'
                }}
              >
                <Button
                  size="large"
                  icon={<LoginOutlined className="text-xl" />}
                  className="flex items-center justify-center px-10 py-8 text-xl font-mono font-bold border-0 transition-all duration-300 relative z-10"
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    boxShadow: `
                      0 0 0 3px rgba(99, 102, 241, 0.8),
                      0 0 0 6px rgba(124, 58, 237, 0.6),
                      0 8px 16px rgba(0, 0, 0, 0.3),
                      0 0 20px rgba(99, 102, 241, 0.4)
                    `,
                    borderRadius: '0px',
                    letterSpacing: '0.1em',
                    textShadow: '0 0 15px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.6)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `
                      0 0 0 3px rgba(255, 255, 255, 0.9),
                      0 0 0 6px rgba(99, 102, 241, 0.8),
                      0 0 30px rgba(99, 102, 241, 0.8),
                      0 0 50px rgba(99, 102, 241, 0.4)
                    `;
                    e.currentTarget.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(99, 102, 241, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `
                      0 0 0 3px rgba(99, 102, 241, 0.8),
                      0 0 0 6px rgba(124, 58, 237, 0.6),
                      0 8px 16px rgba(0, 0, 0, 0.3),
                      0 0 20px rgba(99, 102, 241, 0.4)
                    `;
                    e.currentTarget.style.textShadow = '0 0 15px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.6)';
                  }}
                >
                  ◤ 登录 ◥
                </Button>
                {/* 像素装饰效果 */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-cyan-400 animate-ping"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-pink-400 animate-ping animation-delay-200"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-green-400 animate-ping animation-delay-400"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 animate-ping animation-delay-600"></div>
                </div>
              </div>
            </Link>

            {/* 注册按钮 - 像素风格 */}
            <Link to="/register">
              <div
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  imageRendering: 'pixelated'
                }}
              >
                <Button
                  size="large"
                  icon={<UserAddOutlined className="text-xl" />}
                  className="flex items-center justify-center px-10 py-8 text-xl font-mono font-bold border-0 transition-all duration-300 relative z-10"
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    boxShadow: `
                      0 0 0 3px rgba(168, 85, 247, 0.8),
                      0 0 0 6px rgba(124, 58, 237, 0.6),
                      0 8px 16px rgba(0, 0, 0, 0.3),
                      0 0 20px rgba(168, 85, 247, 0.4)
                    `,
                    borderRadius: '0px',
                    letterSpacing: '0.1em',
                    textShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `
                      0 0 0 3px rgba(255, 255, 255, 0.9),
                      0 0 0 6px rgba(168, 85, 247, 0.8),
                      0 0 30px rgba(168, 85, 247, 0.8),
                      0 0 50px rgba(168, 85, 247, 0.4)
                    `;
                    e.currentTarget.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(168, 85, 247, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `
                      0 0 0 3px rgba(168, 85, 247, 0.8),
                      0 0 0 6px rgba(124, 58, 237, 0.6),
                      0 8px 16px rgba(0, 0, 0, 0.3),
                      0 0 20px rgba(168, 85, 247, 0.4)
                    `;
                    e.currentTarget.style.textShadow = '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)';
                  }}
                >
                  ◤ 注册 ◥
                </Button>
                {/* 像素装饰效果 */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-pink-400 animate-ping"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 animate-ping animation-delay-200"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-yellow-400 animate-ping animation-delay-400"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 animate-ping animation-delay-600"></div>
                </div>
              </div>
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;