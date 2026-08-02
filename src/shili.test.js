import React from 'react';
import { render, screen, fireEvent, waitFor } from '@cmbc/apollo-testing-library';
import { TableJira, TitleJira } from '../baseCom';

describe('TableJira', () => {
  test('测试默认情况下的渲染', () => {
    const { container } = render(
      <TableJira dataSource={[{}]}
        columns={[{ title: 'Name', dataIndex: 'name' }]} />,
    );
    expect(container).toBeTruthy();
  });

  test('测试带有rowSelection的渲染', () => {
    const rowSelection = {
      onChange: jest.fn(),
    };
    const { container } = render(
      <TableJira
        dataSource={[{}]}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        rowSelection={rowSelection}
      />,
    );
    expect(container).toBeTruthy();
  });

  test('测试带有scorllObj的渲染', () => {
    const scorllObj = { x: 1000 };
    const { container } = render(
      <TableJira
        dataSource={[{}]}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        scorllObj={scorllObj}
      />,
    );
    expect(container).toBeTruthy();
  });

  test('测试同时带有rowSelection和scorllObj的渲染', () => {
    const rowSelection = {
      onChange: jest.fn(),
    };
    const scorllObj = { x: 1000 };
    const { container } = render(
      <TableJira
        dataSource={[{}]}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        rowSelection={rowSelection}
        scorllObj={scorllObj}
      />,
    );
    expect(container).toBeTruthy();
  });
});

describe('TitleJira', () => {
  test('测试只有主标题的渲染', () => {
    const { getByText } = render(<TitleJira title='Main Title' />);
    expect(getByText('Main Title')).toBeTruthy();
  });

  test('测试主标题和右侧内容的渲染', () => {
    const { getByText } = render(<TitleJira title='Main Title' subtit='Subtitle' />);
    expect(getByText('Main Title')).toBeTruthy();
    expect(getByText('Subtitle')).toBeTruthy();
  });

  test('测试主标题、右侧内容和子标题同时存在的渲染', () => {
    const { getByText } = render(
      <TitleJira title='Main Title' right='Right Content' subtit='Subtitle' />,
    );
    expect(getByText('Main Title')).toBeTruthy();
    expect(getByText('Right Content')).toBeTruthy();
    expect(getByText('Subtitle')).toBeTruthy();
  });
});