import React, { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { useTheme } from '../components/ThemeProvider';
import TauriTitleBar from '@/components/TauriTitleBar';

const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isDarkMode } = useTheme();

  // Mesh Gradient is now handled by MeshGradientBackground component
  // No CSS background needed efficiently handled by the component

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative transition-all duration-1000 overflow-hidden">
      <TauriTitleBar />
        {/* Animated Canvas Background */}

      {/* Entry animation styles */}
      <style>
        {`
          @keyframes fade-in-up {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <Card
          className="shadow-2xl border-0 overflow-hidden"
          style={{
            background: isDarkMode 
              ? "rgba(0, 0, 0, 0.4)" 
              : "rgba(255, 255, 255, 0.6)", // Lower opacity for heavier glass feel
            backdropFilter: "blur(40px) saturate(180%)", // "Heavy" blur
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            borderRadius: "32px", // Larger, Apple-like rounded corners
            border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)"}`, // Thinner, subtle border
            boxShadow: isDarkMode 
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
                : "0 20px 40px -12px rgba(100, 116, 139, 0.25)",
            maxWidth: "420px",
            margin: "0 auto",
          }}
          styles={{ body: { padding: '40px 32px' } }}
        >
          <div className="text-center mb-10">
            <Title level={2} className="mb-2 tracking-tight" style={{ 
                color: isDarkMode ? '#fff' : '#111827',
                fontWeight: 700,
                letterSpacing: '-0.5px'
            }}>
              {title}
            </Title>
            <Text className="text-base font-medium" style={{ 
                color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' 
            }}>
              {subtitle}
            </Text>
          </div>

          {children}
        </Card>
      </div>
    </div>
  );
};
