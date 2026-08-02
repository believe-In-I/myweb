import { Select } from 'antd';
import React, { Component } from 'react';

class RankSelect extends Component {
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
          '布局算法:'
        ),
        React.createElement(Select, {
          value,
          onChange,
          style: { width: '100%' },
          options: [
            {
              value: 'network-simplex',
              label: '网络简化',
            },
            {
              value: 'tight-tree',
              label: '紧凑树',
            },
            {
              value: 'longest-path',
              label: '最长路径',
            },
          ],
        })
      )
    );
  }
}

export default RankSelect;
