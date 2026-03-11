// src/static-main.tsx
import '@ant-design/v5-patch-for-react-19';
import React from 'react'
import ReactDOM from 'react-dom/client'
import StaticRoot from './components/StaticRoot'
import './styles/modern-blog.css'
import './index.css'
import 'unfonts.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <StaticRoot />
    </React.StrictMode>
)
