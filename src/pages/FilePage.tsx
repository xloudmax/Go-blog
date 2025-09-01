// src/pages/FilePage.tsx
// 查看单篇文章内容的页面
import {
    useEffect as useFileEffect,
    useState as useFileState,
    lazy,
    Suspense,
} from 'react'
import { useParams as useFileParams } from 'react-router-dom'
import { Spin, Alert, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
// MarkdownViewer 在查看页面才会被加载
const MarkdownViewer = lazy(() => import('../components/MarkdownViewer'))
import { getContent as getFileContent } from '../api/markdown'

export default function FilePage() {
    const { folder, file } = useFileParams<{ folder: string; file: string }>()
    const [content, setContent] = useFileState<string>('')
    const [loading, setLoading] = useFileState(true)
    const [error, setError] = useFileState<string | undefined>(undefined)

    // 根据路由参数加载文章内容
    useFileEffect(() => {
        if (!folder || !file) {
            setError('参数不足：文件夹或文件名缺失')
            setLoading(false)
            return
        }
        setLoading(true)
        setError(undefined)
        getFileContent(folder, file)
            .then(res => {
                setContent(res.data.content)
            })
            .catch(err => {
                setError(err.response?.data?.error || '加载文件内容失败')
            })
            .finally(() => setLoading(false))
    }, [folder, file])

    if (loading) {
        return (
            <div className="flex justify-center p-6">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="m-5">
                <Alert message={error} type="error" showIcon />
            </Card>
        )
    }

    // 使用 Suspense 包裹异步组件，提供加载状态
    return (
        <Card className="m-5">
            <Suspense
                fallback={
                    <div className="flex justify-center p-6">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    </div>
                }
            >
                <MarkdownViewer content={content} />
            </Suspense>
        </Card>
    )
}