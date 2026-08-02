import { Select } from 'antd';
import React, { Component } from 'react';

class EdgeSelect extends Component {
  render() {
    const { 
      value, 
      onChange, 
      Co = 6, 
      minWidth = 50 
    } = this.props;

    return React.createElement(
      'div',
      {
        style: {
          width: Co + '%',
          minWidth: minWidth + 'px'
        }
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center'
          }
        },
        React.createElement(
          'span',
          { style: { whiteSpace: 'nowrap' } },
          '图表风格:'
        ),
        React.createElement(Select, {
          value,
          onChange,
          style: { width: '100%' },
          options: [
            {
              value: 'polyline',
              label: '折线风格',
            },
            {
              value: 'OrthPolyline',
              label: '直角折线风格',
            },
            {
              value: 'cubic-horizontal',
              label: '贝塞尔曲线风格',
            },
            {
              value: 'line',
              label: '直线风格',
            },
            {
              value: 'cubic',
              label: '曲线风格',
            },
          ],
        })
      )
    );
  }
}

export default EdgeSelect;
