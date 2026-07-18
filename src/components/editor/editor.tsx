import {Editor as MonacoEditor} from "@monaco-editor/react";
import { useFileStore } from "../../store/filestore";
import { useThemeStore } from "../../store/themeStore";
import Terminal from "../terminal/terminal.tsx";

export default function Editor(){
    const files = useFileStore((state) => state.files);
    const activeFileId = useFileStore((state) => state.activeFileId);
    const updateFileContent = useFileStore((state) => state.updateFileContent);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "light";
    const activeFile = files.find(f => f.id === activeFileId);

    if (!activeFile) {
        return (
            <div className="editor-container" style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666"
            }}>
                <h2>No file open</h2>
            </div>
        );
    }

    if (activeFile.kind === "terminal") {
        return (
            <div className="editor-container" style={{height: "100%", width: "100%", overflow: "hidden"}}>
                <Terminal />
            </div>
        );
    }

    return(
        <div className= "editor-container" style={{height: "100%", width: "100%", overflow: "hidden"}}>
            <MonacoEditor
                height="100%"
                width="100%"
                theme={editorTheme}
                path={activeFile.path}
                value={activeFile.content}
                onChange={(value) => updateFileContent(activeFile.id, value || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 16 }
                }}
            />
        </div>
    );
}    