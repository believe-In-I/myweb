import React, { Component } from 'react';

class TitleView extends Component {
  render() {
    const {
      Co = 6,
      title = '',
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
          { style: { fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' } },
          title
        )
      )
    );
  }
}

export default TitleView;
