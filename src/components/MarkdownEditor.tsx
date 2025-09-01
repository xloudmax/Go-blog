// @/components/MarkdownEditor.tsx
// 使用 @uiw/react-md-editor 实现的 Markdown 编辑器
// 父组件通过 onSave 获取最新内容
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { ThemeContext } from '@/components/ThemeProvider'
import { Card, Button, Space, Tooltip, message, Modal } from 'antd'
import {
  SaveOutlined,
  EyeOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

interface MarkdownEditorProps {
    /** 初始内容 */
    initialValue: string
    /** 保存时的回调 */
    onSave: (markdown: string) => Promise<void>
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ initialValue, onSave }) => {
    const [value, setValue] = useState<string | undefined>(initialValue)
    const [isSaving, setIsSaving] = useState(false)
    const { theme } = useContext(ThemeContext)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isDirty, setIsDirty] = useState(false)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)

    // 当父组件传入的内容变化时同步到内部状态
    useEffect(() => {
        setValue(initialValue)
        setIsDirty(false)
    }, [initialValue])

    // 监听内容变化
    useEffect(() => {
        if (value !== initialValue) {
            setIsDirty(true)
        } else {
            setIsDirty(false)
        }
    }, [value, initialValue])

    // 处理保存
    const handleInternalSave = useCallback(async () => {
        setIsSaving(true)
        try {
            await onSave(value || '')
            setLastSaved(new Date())
            setIsDirty(false)
            setShowSaveSuccess(true)
            setTimeout(() => setShowSaveSuccess(false), 3000)
        } catch {
            message.error('保存失败，请重试')
        } finally {
            setIsSaving(false)
        }
    }, [value, onSave])

    // 保存前确认
    const confirmSave = useCallback(() => {
        if (!isDirty) {
            message.info('内容无变化，无需保存')
            return
        }

        Modal.confirm({
            title: '确认保存',
            icon: <ExclamationCircleOutlined />,
            content: '您确定要保存当前文章吗？',
            okText: '保存',
            cancelText: '取消',
            onOk: handleInternalSave
        });
    }, [isDirty, handleInternalSave])

    // 处理键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S 或 Cmd+S 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isDirty) {
                    confirmSave();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDirty, confirmSave]);

    // 处理编辑器内容变化
    const handleEditorChange = useCallback((newValue?: string) => {
        setValue(newValue || '')
    }, [])

    // 自动保存功能
    useEffect(() => {
        // 添加自动保存间隔配置
        const autoSaveInterval = parseInt(localStorage.getItem('autoSaveInterval') || '30000', 10);

        const autoSaveTimer = setTimeout(() => {
            if (isDirty && !isSaving) {
                message.info('正在自动保存...');
                handleInternalSave()
                    .then(() => {
                        message.success('自动保存成功');
                    })
                    .catch(() => {
                        message.error('自动保存失败，将在稍后重试');
                        // 可以实现重试机制
                    });
            }
        }, autoSaveInterval); // 使用配置的间隔

        return () => clearTimeout(autoSaveTimer);
    }, [isDirty, isSaving, handleInternalSave]);

    // 切换全屏模式
    const toggleFullscreen = async () => {
        if (!editorRef.current) return;

        try {
            if (!isFullscreen) {
                // 进入全屏
                if (editorRef.current.requestFullscreen) {
                    await editorRef.current.requestFullscreen();
                }
            } else {
                // 退出全屏
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        } catch (error) {
            console.warn('全屏操作失败:', error);
            // 如果全屏 API 调用失败，仍然更新状态以保持 UI 一致性
            setIsFullscreen(!isFullscreen);
        }
    };

    // 监听全屏状态变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isCurrentlyFullscreen);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // 插入常用Markdown语法
    const insertMarkdown = (syntax: string) => {
        if (!value) {
            setValue(syntax);
            return;
        }

        // 简单的插入逻辑，实际项目中可能需要更复杂的光标位置处理
        setValue(value + '\n' + syntax);
    };

    return (
        <Card
            ref={editorRef}
            className="optimized-card"
            bodyStyle={{ padding: '16px' }}
        >
            <div
                data-color-mode={theme}
            >
                {/* 状态栏 */}
                <div className="flex flex-wrap items-center justify-between mb-2 gap-2 text-sm text-gray-500">
                    <div>
                        {isDirty ? (
                            <span className="text-orange-500">● 有未保存的更改</span>
                        ) : lastSaved ? (
                            <span className="text-green-500 flex items-center">
                                <CheckCircleOutlined className="mr-1" />
                                已保存 {lastSaved.toLocaleTimeString()}
                            </span>
                        ) : (
                            <span>未修改</span>
                        )}
                    </div>
                    <div>
                        字数: {value ? value.length : 0}
                    </div>
                </div>

                {/* 工具栏 */}
                <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <Space wrap>
                        <Tooltip title="标题">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('# 标题')}
                                className="optimized-button"
                            >
                                H1
                            </Button>
                        </Tooltip>
                        <Tooltip title="粗体">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('**粗体文字**')}
                                className="optimized-button"
                            >
                                B
                            </Button>
                        </Tooltip>
                        <Tooltip title="斜体">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('*斜体文字*')}
                                className="optimized-button"
                            >
                                I
                            </Button>
                        </Tooltip>
                        <Tooltip title="代码">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('`代码`')}
                                className="optimized-button"
                            >
                                Code
                            </Button>
                        </Tooltip>
                        <Tooltip title="链接">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('[链接文本](https://)')}
                                className="optimized-button"
                            >
                                Link
                            </Button>
                        </Tooltip>
                        <Tooltip title="图片">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('![图片描述](https://)')}
                                className="optimized-button"
                            >
                                Img
                            </Button>
                        </Tooltip>
                        <Tooltip title="引用">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('> 引用内容')}
                                className="optimized-button"
                            >
                                Quote
                            </Button>
                        </Tooltip>
                        <Tooltip title="列表">
                            <Button
                                size="small"
                                onClick={() => insertMarkdown('- 列表项')}
                                className="optimized-button"
                            >
                                List
                            </Button>
                        </Tooltip>
                    </Space>
                    <Space>
                        <Tooltip title="版本历史">
                            <Button
                                size="small"
                                icon={<HistoryOutlined />}
                                onClick={() => message.info('版本历史功能即将推出')}
                                className="optimized-button"
                            />
                        </Tooltip>
                        <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                            <Button
                                size="small"
                                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                onClick={toggleFullscreen}
                                className="optimized-button"
                            />
                        </Tooltip>
                    </Space>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        <MDEditor
                            value={value}
                            onChange={handleEditorChange}
                            height={isFullscreen ? window.innerHeight - 200 : 500}
                            preview="edit"
                            fullscreen={false} // 我们自己实现全屏功能
                        />
                    </div>
                    <div style={{ flex: 1, padding: '16px', overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                        <h3 style={{ marginTop: 0 }}>预览效果</h3>
                        <MDEditor.Markdown source={value || ''} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Space>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => message.info('预览功能已在右侧实时显示')}
                            className="optimized-button"
                        >
                            预览
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={confirmSave}
                            loading={isSaving}
                            className="optimized-button"
                        >
                            {isSaving ? '保存中...' : '保存'}
                        </Button>
                    </Space>
                </div>

                {/* 保存成功提示 */}
                {showSaveSuccess && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300">
                        <CheckCircleOutlined className="mr-2" />
                        文章保存成功！
                    </div>
                )}
            </div>
        </Card>
    )
}

export default MarkdownEditor
