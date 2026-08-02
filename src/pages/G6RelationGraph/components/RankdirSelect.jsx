import { Select } from 'antd';
import React, { Component } from 'react';

class RankdirSelect extends Component {
  render() {
    const { 
      value, 
      onChange, 
      Co = 6, 
      show = true, 
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
            display: show ? 'flex' : 'none',
            alignItems: 'center'
          }
        },
        React.createElement(
          'span', 
          { style: { whiteSpace: 'nowrap' } }, 
          '布局方向:'
        ),
        React.createElement(Select, {
          value,
          onChange,
          style: { width: '100%' },
          options: [
            {
              value: 'LR',
              label: '左右布局',
            },
            {
              value: 'TB',
              label: '上下布局',
            },
          ],
        })
      )
    );
  }
}

export default RankdirSelect;
