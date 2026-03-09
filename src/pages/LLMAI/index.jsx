import { useCallback, useState, useRef } from "react";
import { Ollama } from "ollama";
import { AIChatInput, AIChatDialogue, Avatar } from "@douyinfe/semi-ui";
import "./index.less";

const { Configure } = AIChatInput;
const ollama = new Ollama({
  host: window.location.origin + "/ollama",
  headers: {
    Authorization: "Bearer " + import.meta.env.VITE_LLM_API_KEY,
  },
});

const modelOptions = [
  { value: "qwen3:latest", label: "qwen3:latest" },
  { value: "gemma3:latest", label: "gemma3:latest" },
  // { value: "gpt-oss-safeguard", label: "gpt-oss-safeguard" },
];

// const mcpOptions = [
//   { icon: <IconFeishuLogo />, label: "飞书文档", value: "feishu" },
//   { icon: <IconGit />, label: "Github Mcp", value: "github" },
//   { icon: <IconFigma />, label: "IconFigma Mcp", value: "IconFigma" },
// ];

// const radioButtonProps = [
//   { label: "极速", value: "fast" },
//   { label: "思考", value: "think" },
//   { label: "超能", value: "super" },
// ];

function LLMAi() {
  const inputRef = useRef(null);
  const [model, setModel] = useState("qwen3:latest");
  const [dialogue, setDialogue] = useState([]);

  const roleConfig = {
    user: {
      name: "User",
      avatar:
        "https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png",
    },
    assistant: {
      name: "Assistant",
      avatar:
        "https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png",
    },
    system: {
      name: "System",
      avatar:
        "https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png",
    },
  };

  const renderLeftMenu = useCallback(
    () => (
      <>
        <Configure.Select
          optionList={modelOptions}
          field="model"
          initValue="qwen3:latest"
          onChange={(value) => {
            setModel(value);
          }}
        />
        {/* <Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
          联网搜索
        </Configure.Button> */}
        {/* <Configure.Mcp
          options={mcpOptions}
          onConfigureButtonClick={onConfigureButtonClick}
          showConfigure={true}
        /> */}
        {/* <Configure.RadioButton
          options={radioButtonProps}
          field="thinkType"
          initValue="fast"
        /> */}
      </>
    ),
    [],
  );

  const renderConfig = {
    renderDialogueTitle: (props) => {
      return (
        <div className="semi-ai-chat-dialogue-title">My-{props.role.name}</div>
      );
    },
    renderDialogueAvatar: (props) => {
      return (
        <Avatar
          src={props.role.avatar}
          size="extra-small"
          shape="square"
        ></Avatar>
      );
    },
    renderDialogueAction: (props) => {
      return <div className={props.className}>{props.defaultActions[0]}</div>;
    },
  };
  const onMessageSend = useCallback(
    async (input) => {
      // 解析出要发的文字，确保 content 是字符串
      inputRef.current?.setContent("");
      let content = "";
      if (typeof input === "string") {
        content = input;
      } else if (input && typeof input === "object") {
        content =
          input.inputContents?.[0]?.text ||
          input.content ||
          JSON.stringify(input);
      }

      if (!content) return;

      const newMessages = [
        ...dialogue.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      setDialogue((prev) => [
        ...prev,
        { role: "user", content },
        { role: "assistant", content: "" },
      ]);
      const response = await ollama.chat({
        // model: "gemma3:latest",
        model: model,
        messages: newMessages,
        stream: true,
        // think: true,
      });
      for await (const part of response) {
        setDialogue((prev) => {
          const newDialogue = [...prev];
          const lastMsg = newDialogue[newDialogue.length - 1];
          if (lastMsg.role === "assistant") {
            newDialogue[newDialogue.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + part.message.content,
            };
          }
          return newDialogue;
        });
      }
    },
    [dialogue, model],
  );

  return (
    <div className="llm-ai-container">
      <div className="configure-button-container">
        <AIChatDialogue
          align="leftRight"
          mode="bubble"
          chats={dialogue}
          roleConfig={roleConfig}
          // onChatsChange={onChatsChange}
          dialogueRenderConfig={renderConfig}
        />
      </div>
      <div className="configure-button">
        <AIChatInput
          canSend
          ref={inputRef}
          placeholder={"发送消息提问"}
          renderConfigureArea={renderLeftMenu}
          onMessageSend={onMessageSend}
          // uploadProps={uploadProps}
          showUploadButton={false}
          className="ai-chat-input"
        />
      </div>
    </div>
  );
}

export default LLMAi;
