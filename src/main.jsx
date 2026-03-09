import React from 'react';
import { createRoot } from 'react-dom/client';
import RouterApp from './RouterApp';
import './i18n';
import './index.css';
import 'antd/dist/reset.css';
// Temporary fix for missing exports in @douyinfe/semi-ui package.json
import '../node_modules/@douyinfe/semi-ui/dist/css/semi.min.css';

createRoot(document.getElementById('root')).render(<RouterApp />);
