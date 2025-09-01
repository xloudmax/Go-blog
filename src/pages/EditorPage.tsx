// src/pages/EditorPage.tsx
// 新建或编辑文章的页面
// 使用 lazy 与 Suspense 按需加载编辑器，减少首屏体积
import React, { useEffect, useState, SetStateAction, Suspense, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Spin, 
  Select, 
  Input,
    Card,
  Button,
  Typography,
  message,
  Space,
  Divider,
  Tooltip,
  Tag,
  Row,
  Col,
  Modal
} from 'antd';
import { 
  LoadingOutlined, 
  SaveOutlined, 
  EyeOutlined, 
  HistoryOutlined,
    CloudUploadOutlined,
  FileTextOutlined,
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import MarkdownEditor from '@/components/MarkdownEditor'
import {
    getContent,
    uploadFile,
    updateFile,
    getFolders,
} from '@/api/markdown'

const { Option } = Select;
const { Title, Text } = Typography;

export default function EditorPage() {
    const { folder, file: fileNameFromParams } = useParams<{ folder: string; file?: string }>()
    const navigate = useNavigate()

    const [markdownContent, setMarkdownContent] = useState('')
    const [newFileTitle, setNewFileTitle] = useState('')
    const [initialContentLoaded, setInitialContentLoaded] = useState(false)
    const [loading, setLoading] = useState(!!fileNameFromParams)
    const [isSaving, setIsSaving] = useState(false)
    const [folders, setFolders] = useState<string[]>([])
    const [selectedFolder, setSelectedFolder] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')
    const [coverImage, setCoverImage] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [isPreviewVisible, setIsPreviewVisible] = useState(false)

    const isEditMode = !!fileNameFromParams

    // 根据是否编辑模式加载初始内容
    useEffect(() => {
        if (isEditMode && folder && fileNameFromParams) {
            setLoading(true)
            getContent(folder, fileNameFromParams)
                .then((res: { data: { content: SetStateAction<string> } }) => {
                    setMarkdownContent(res.data.content)
                })
                .catch(() => message.error('加载文章内容失败'))
                .finally(() => {
                    setLoading(false)
                    setInitialContentLoaded(true)
                })
        } else {
            setMarkdownContent('')
            setNewFileTitle('')
            setInitialContentLoaded(true)
        }
    }, [folder, fileNameFromParams, isEditMode])

    // 新建模式下获取可用文件夹列表
    useEffect(() => {
        if (!isEditMode) {
            getFolders()
                .then(res => {
                    setFolders(res.data.folders)
                    if (folder) {
                        setSelectedFolder(folder)
                    } else if (res.data.folders.length > 0) {
                        setSelectedFolder(res.data.folders[0])
                    }
                })
                .catch(() => message.error('加载文件夹列表失败'))
        }
    }, [isEditMode, folder])

    // 提取文章摘要
    const extractExcerpt = useCallback((content: string, maxLength: number = 200) => {
        if (!content) return '';
        // 移除Markdown标记
        const plainText = content
            .replace(/[#*`>\-[\]()]/g, '')
            .replace(/!\[.*?]\(.*?\)/g, '')
            .replace(/\[.*?]\(.*?\)/g, '')
            .trim();
        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + '...'
            : plainText;
    }, []);

    // 当内容变化时自动更新摘要
    useEffect(() => {
        if (!isEditMode && markdownContent) {
            setExcerpt(extractExcerpt(markdownContent));
        }
    }, [markdownContent, extractExcerpt, isEditMode]);

    // 添加标签
    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    // 删除标签
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // 处理回车添加标签
    const handleTagInputPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const handleSave = async (currentMarkdown: string) => {
        const targetFolder = isEditMode ? folder : selectedFolder
        if (!targetFolder) {
            message.error('请选择保存的文件夹！');
            return
        }
        setIsSaving(true)
        try {
            if (isEditMode && fileNameFromParams) {
                await updateFile(targetFolder, fileNameFromParams, currentMarkdown)
                message.success('文章更新成功！')
                navigate(`/posts/${targetFolder}/${fileNameFromParams}`)
            } else {
                if (!newFileTitle.trim()) {
                    message.error('请输入文章标题！')
                    setIsSaving(false)
                    return
                }
                const titleForUpload = newFileTitle.trim()
                const blob = new Blob([currentMarkdown], { type: 'text/markdown' })
                const mdFile = new File([blob], `${titleForUpload}.md`)
                await uploadFile(mdFile, targetFolder, titleForUpload)
                message.success('文章创建成功！')
                navigate(`/posts/${targetFolder}/${titleForUpload}.md`)
            }
        } catch (err: any) {
            message.error(err.response?.data?.error || '保存失败')
        } finally {
            setIsSaving(false)
        }
    }

    // 显示预览
    const showPreview = () => {
        setIsPreviewVisible(true);
    };

    // 关闭预览
    const closePreview = () => {
        setIsPreviewVisible(false);
    };

    if (loading && isEditMode && !initialContentLoaded) {
        return (
            <div className="flex justify-center p-6">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
        )
    }

    if (!initialContentLoaded && isEditMode) {
        return <p>正在准备编辑器...</p>
    }

    return (
        <div className="m-5 fade-in">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <div>
                    <Title level={2} className="text-2xl font-bold text-display-2 mb-0">
                        {isEditMode ? '编辑文章' : '新建文章'}
                    </Title>
                    <Text type="secondary">使用Markdown语法编写您的文章</Text>
                </div>
                <Space wrap>
                    <Button 
                        icon={<EyeOutlined />} 
                        onClick={showPreview}
                    >
                        预览
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<SaveOutlined />} 
                        onClick={() => handleSave(markdownContent)}
                        loading={isSaving}
                    >
                        {isSaving ? '保存中...' : '保存文章'}
                    </Button>
                </Space>
            </div>
            
            {!isEditMode && (
                <Card className="mb-5 optimized-card">
                    <Title level={4} className="text-heading-3">文章信息</Title>
                    <Divider className="my-3" />
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <div className="space-y-4">
                                <div>
                                    <Text className="optimized-label">文件夹 <span className="text-red-500">*</span></Text>
                                    <Select
                                        value={selectedFolder}
                                        onChange={value => setSelectedFolder(value)}
                                        style={{ width: '100%' }}
                                        placeholder="选择保存路径"
                                        className="optimized-input"
                                    >
                                        {folders.map(f => (
                                            <Option key={f} value={f}>
                                                {f}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Text className="optimized-label">文章标题 <span className="text-red-500">*</span></Text>
                                    <Input
                                        placeholder="请输入文章标题（将作为文件名，不含.md）"
                                        value={newFileTitle}
                                        onChange={e => setNewFileTitle(e.target.value)}
                                        style={{ width: '100%' }}
                                        maxLength={100}
                                        className="optimized-input"
                                    />
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center">
                                        <Text className="optimized-label">标签</Text>
                                        <Tooltip title="添加标签可以帮助用户更好地发现您的文章">
                                            <InfoCircleOutlined className="ml-2 text-gray-400" />
                                        </Tooltip>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map((tag) => (
                                            <Tag 
                                                key={tag} 
                                                closable 
                                                onClose={() => removeTag(tag)}
                                                className="rounded-full"
                                            >
                                                {tag}
                                            </Tag>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="输入标签后按回车添加"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onPressEnter={handleTagInputPress}
                                            className="optimized-input flex-1"
                                        />
                                        <Button 
                                            icon={<PlusOutlined />} 
                                            onClick={addTag}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Text className="optimized-label">封面图片URL</Text>
                                    <Input
                                        placeholder="https://example.com/image.jpg"
                                        value={coverImage}
                                        onChange={e => setCoverImage(e.target.value)}
                                        className="optimized-input"
                                    />
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <div className="mt-4">
                        <Text className="optimized-label">文章摘要</Text>
                        <Input.TextArea
                            placeholder="自动生成的文章摘要，您可以手动修改"
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            rows={3}
                            className="optimized-input"
                        />
                    </div>
                </Card>
            )}
            
            {/* 操作按钮栏 */}
            <Card className="mb-5 optimized-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Space>
                        <Button 
                            icon={<FileTextOutlined />} 
                            onClick={() => {
                                // 插入标题
                                const titleTemplate = '# 标题\n\n';
                                setMarkdownContent(titleTemplate + markdownContent);
                            }}
                        >
                            标题
                        </Button>
                        <Button 
                            icon={<FileTextOutlined />} 
                            onClick={() => {
                                // 插入代码块
                                const codeTemplate = '\n```\n// 在此处编写代码\n```\n';
                                setMarkdownContent(markdownContent + codeTemplate);
                            }}
                        >
                            代码块
                        </Button>
                        <Button 
                            icon={<FileTextOutlined />} 
                            onClick={() => {
                                // 插入链接
                                const linkTemplate = '[链接文本](https://)';
                                setMarkdownContent(markdownContent + linkTemplate);
                            }}
                        >
                            链接
                        </Button>
                        <Button 
                            icon={<FileTextOutlined />} 
                            onClick={() => {
                                // 插入图片
                                const imageTemplate = '![图片描述](https://)';
                                setMarkdownContent(markdownContent + imageTemplate);
                            }}
                        >
                            图片
                        </Button>
                    </Space>
                    <Space>
                        <Button 
                            icon={<HistoryOutlined />} 
                            onClick={() => message.info('版本历史功能即将推出')}
                        >
                            版本历史
                        </Button>
                        {!isEditMode && (
                            <Button 
                                icon={<CloudUploadOutlined />} 
                                onClick={() => message.info('发布功能即将推出')}
                            >
                                发布
                            </Button>
                        )}
                    </Space>
                </div>
            </Card>
            
            {/* Suspense 处理异步加载的组件，fallback 为加载占位符 */}
            <Suspense
                fallback={
                    <div className="flex justify-center p-6">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    </div>
                }
            >
                <MarkdownEditor
                    initialValue={markdownContent}
                    onSave={handleSave}
                />
            </Suspense>
            
            {/* 预览模态框 */}
            <Modal
                title="文章预览"
                open={isPreviewVisible}
                onCancel={closePreview}
                footer={[
                    <Button key="close" onClick={closePreview} className="optimized-button">
                        关闭
                    </Button>
                ]}
                width="80%"
                className="optimized-card"
            >
                <div className="p-4 bg-white rounded-lg">
                    <h1 className="text-3xl font-bold mb-4">{newFileTitle || '未命名文章'}</h1>
                    {coverImage && (
                        <img src={coverImage} alt="封面" className="w-full h-auto rounded-lg mb-4" />
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map(tag => (
                            <Tag key={tag} className="rounded-full">{tag}</Tag>
                        ))}
                    </div>
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: markdownContent.replace(/\n/g, '<br>') }} />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
