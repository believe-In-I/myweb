import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';

const { Item: FormItem } = Form;

/**
 * 新增业务链路弹窗组件
 */
class AddBusinessModal extends Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();
  }

  /**
   * 组件更新时设置表单初始值
   */
  componentDidUpdate(prevProps) {
    const { visible, params } = this.props;
    // 当弹窗打开且参数变化时，设置初始值
    if (visible && !prevProps.visible && params && Object.keys(params).length > 0) {
      const initialValues = {};
      if (params.targetServiceUnit) {
        initialValues.targetServiceUnit = params.targetServiceUnit;
      }
      if (params.callServiceName) {
        initialValues.callServiceName = params.callServiceName;
      }
      // 使用 setTimeout 确保表单已挂载
      setTimeout(() => {
        if (this.formRef.current) {
          this.formRef.current.setFieldsValue(initialValues);
        }
      }, 0);
    }
  }

  /**
   * 关闭弹窗
   */
  handleCancel = () => {
    const { onCancel } = this.props;
    if (this.formRef.current) {
      this.formRef.current.resetFields();
    }
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  /**
   * 提交表单
   */
  handleSubmit = () => {
    const { onSubmit } = this.props;
    if (this.formRef.current) {
      this.formRef.current.validateFields().then((values) => {
        console.log('用户填写的表单内容：', values);
        message.success('提交成功！');
        if (typeof onSubmit === 'function') {
          onSubmit(values);
        }
        // 重置表单
        this.formRef.current.resetFields();
      }).catch((error) => {
        console.error('表单验证失败：', error);
        message.error('请填写必填字段');
      });
    }
  };

  render() {
    const { visible, params = {} } = this.props;
    const mode = params.mode || 1;

    // 情况1：mode=1，禁用 targetServiceUnit 和 callServiceName
    // 情况2：mode=2，只禁用 targetServiceUnit
    const isMode1 = mode === 1;
    const isMode2 = mode === 2;

    // targetServiceUnit 在两种模式下都禁用
    const targetServiceUnitDisabled = true;
    // callServiceName 只在 mode=1 时禁用
    const callServiceNameDisabled = isMode1;

    // 根据模式设置弹窗标题
    const modalTitle = isMode1 ? '新增业务链路1' : '新增业务链路2';

    return (
      <Modal
        title={modalTitle}
        open={visible}
        onCancel={this.handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form ref={this.formRef} layout="vertical">
          <FormItem
            name="businessType"
            label="业务类别"
            rules={[{ required: true, message: '请输入业务类别' }]}
          >
            <Input placeholder="请输入业务类别" />
          </FormItem>
          <FormItem
            name="businessName"
            label="业务名称"
            rules={[{ required: true, message: '请输入业务名称' }]}
          >
            <Input placeholder="请输入业务名称" />
          </FormItem>
          <FormItem
            name="businessLinkName"
            label="业务链路名称"
            rules={[{ required: true, message: '请输入业务链路名称' }]}
          >
            <Input placeholder="请输入业务链路名称" />
          </FormItem>
          <FormItem
            name="targetSys"
            label="系统名称"
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input placeholder="请输入系统名称" />
          </FormItem>
          <FormItem
            name="targetModule"
            label="模块名称"
          >
            <Input placeholder="请输入模块名称" />
          </FormItem>
          <FormItem
            name="targetServiceUnit"
            label="服务单元名称"
          >
            <Input
              placeholder="请输入服务单元名称"
              disabled={targetServiceUnitDisabled}
            />
          </FormItem>
          <FormItem
            name="callServiceName"
            label="调用名称"
          >
            <Input
              placeholder="请输入调用名称"
              disabled={callServiceNameDisabled}
            />
          </FormItem>
          <FormItem
            name="opUser"
            label="操作人"
            rules={[{ required: true, message: '请输入操作人' }]}
          >
            <Input placeholder="请输入操作人" />
          </FormItem>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={this.handleCancel}>取消</Button>
            <Button type="primary" onClick={this.handleSubmit}>
              提交
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
}

export default AddBusinessModal;
