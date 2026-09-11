import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { getAppleTheme } from './appleTheme';

export default function AppleThemeProvider({ children }) {
  const [dark, setDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setDark(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <ConfigProvider locale={zhTW} theme={getAppleTheme(dark)}>
      {children}
    </ConfigProvider>
  );
}
