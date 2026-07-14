import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
};

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  height = "300px",
}: CodeEditorProps) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(newValue) => onChange(newValue || "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
        automaticLayout: true,
      }}
    />
  );
}