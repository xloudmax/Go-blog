// 响应式测试工具
export const responsiveBreakpoints = {
  xs: 0,      // 超小屏幕 (手机, 小于 576px)
  sm: 576,    // 小屏幕 (手机, 576px 及以上)
  md: 768,    // 中等屏幕 (平板, 768px 及以上)
  lg: 992,    // 大屏幕 (桌面, 992px 及以上)
  xl: 1200,   // 超大屏幕 (大桌面, 1200px 及以上)
  xxl: 1600   // 超超大屏幕 (超大桌面, 1600px 及以上)
};

export type Breakpoint = keyof typeof responsiveBreakpoints;

export const getBreakpoint = (width: number): Breakpoint => {
  if (width < responsiveBreakpoints.sm) return 'xs';
  if (width < responsiveBreakpoints.md) return 'sm';
  if (width < responsiveBreakpoints.lg) return 'md';
  if (width < responsiveBreakpoints.xl) return 'lg';
  if (width < responsiveBreakpoints.xxl) return 'xl';
  return 'xxl';
};

export const isMobile = (width: number): boolean => {
  return width < responsiveBreakpoints.md;
};

export const isTablet = (width: number): boolean => {
  return width >= responsiveBreakpoints.md && width < responsiveBreakpoints.lg;
};

export const isDesktop = (width: number): boolean => {
  return width >= responsiveBreakpoints.lg;
};

// 响应式类名生成器
export const getResponsiveClasses = (width: number): string => {
  const breakpoint = getBreakpoint(width);
  const classes = [`breakpoint-${breakpoint}`];
  
  if (isMobile(width)) {
    classes.push('device-mobile');
  } else if (isTablet(width)) {
    classes.push('device-tablet');
  } else {
    classes.push('device-desktop');
  }
  
  return classes.join(' ');
};

// 响应式样式对象生成器
export const getResponsiveStyles = (width: number) => {
  return {
    '--current-breakpoint': getBreakpoint(width),
    '--is-mobile': isMobile(width) ? 'true' : 'false',
    '--is-tablet': isTablet(width) ? 'true' : 'false',
    '--is-desktop': isDesktop(width) ? 'true' : 'false'
  };
};