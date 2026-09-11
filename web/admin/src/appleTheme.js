import { theme } from 'antd';

export const appleFont =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const shared = {
  colorSuccess: '#34c759',
  colorWarning: '#ff9f0a',
  colorError: '#ff3b30',
  borderRadius: 12,
  borderRadiusLG: 18,
  fontFamily: appleFont,
  fontSize: 16,
  controlHeight: 44,
  controlHeightLG: 48,
  wireframe: false,
};

export function getAppleTheme(isDark) {
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      ...shared,
      colorPrimary: isDark ? '#0a84ff' : '#0071e3',
      colorInfo: isDark ? '#0a84ff' : '#0071e3',
      colorTextBase: isDark ? '#f5f5f7' : '#1d1d1f',
      colorBgBase: isDark ? '#000000' : '#ffffff',
      colorBgLayout: isDark ? '#1d1d1f' : '#f5f5f7',
      colorBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    components: {
      Button: {
        borderRadius: 980,
        fontWeight: 500,
        primaryShadow: 'none',
      },
      Card: {
        borderRadiusLG: 18,
        paddingLG: 24,
      },
      Tabs: {
        itemActiveColor: isDark ? '#0a84ff' : '#0071e3',
        inkBarColor: isDark ? '#0a84ff' : '#0071e3',
        titleFontSize: 16,
      },
      Input: {
        borderRadius: 12,
        controlHeight: 44,
      },
      Select: {
        borderRadius: 12,
        controlHeight: 44,
      },
      Modal: {
        borderRadiusLG: 18,
      },
      Table: {
        headerBg: isDark ? '#1d1d1f' : '#f5f5f7',
        headerColor: isDark ? '#f5f5f7' : '#1d1d1f',
        rowHoverBg: isDark ? 'rgba(10,132,255,0.08)' : 'rgba(0,113,227,0.06)',
      },
    },
  };
}
