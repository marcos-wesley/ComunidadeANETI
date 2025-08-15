import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  Code, 
  List, 
  ListOrdered,
  Quote,
  Eye,
  Edit3
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Escreva seu conteúdo...", 
  rows = 8,
  disabled = false 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newText);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = 
      value.substring(0, start) + 
      text + 
      value.substring(start);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Negrito",
      action: () => insertText("**", "**", "texto em negrito"),
    },
    {
      icon: Italic,
      label: "Itálico",
      action: () => insertText("*", "*", "texto em itálico"),
    },
    {
      icon: Underline,
      label: "Sublinhado",
      action: () => insertText("<u>", "</u>", "texto sublinhado"),
    },
    {
      icon: Code,
      label: "Código inline",
      action: () => insertText("`", "`", "código"),
    },
    {
      icon: Link,
      label: "Link",
      action: () => insertText("[", "](https://exemplo.com)", "texto do link"),
    },
    {
      icon: Image,
      label: "Imagem",
      action: () => insertText("![", "](https://exemplo.com/imagem.jpg)", "alt text"),
    },
    {
      icon: Quote,
      label: "Citação",
      action: () => insertAtCursor("> "),
    },
    {
      icon: List,
      label: "Lista não ordenada",
      action: () => insertAtCursor("- "),
    },
    {
      icon: ListOrdered,
      label: "Lista ordenada",
      action: () => insertAtCursor("1. "),
    },
  ];

  const insertCodeBlock = () => {
    insertText("```\n", "\n```", "código aqui");
  };

  const insertTable = () => {
    const tableTemplate = `
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Linha 1  | Linha 1  | Linha 1  |
| Linha 2  | Linha 2  | Linha 2  |
`;
    insertAtCursor(tableTemplate.trim());
  };

  return (
    <div className="w-full border rounded-md">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1">
            {toolbarButtons.map((button, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                disabled={disabled}
                title={button.label}
                className="h-8 w-8 p-0"
              >
                <button.icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="mx-2 h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={insertCodeBlock}
              disabled={disabled}
              title="Bloco de código"
              className="h-8 px-2 text-xs"
            >
              {"{ }"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertTable}
              disabled={disabled}
              title="Tabela"
              className="h-8 px-2 text-xs"
            >
              Tabela
            </Button>
          </div>

          <TabsList className="grid w-32 grid-cols-2">
            <TabsTrigger value="edit" className="text-xs">
              <Edit3 className="h-3 w-3 mr-1" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0 p-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className="border-0 rounded-none resize-none focus-visible:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 p-4 min-h-[200px]">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <div className="text-muted-foreground text-sm">
              Nada para visualizar ainda. Escreva algo na aba "Editar" para ver o preview.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/50">
        <p>
          Suporte a <strong>Markdown</strong>: **negrito**, *itálico*, `código`, [links](url), ![imagens](url), #hashtags
        </p>
      </div>
    </div>
  );
}