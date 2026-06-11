import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useValidationImportStore } from '@/store/validationImportStore';
import { Building2, Upload, Download, RotateCcw, AlertCircle, BarChart3 } from 'lucide-react';

export default function Toolbar() {
  const importConfig = useValidationImportStore((s) => s.importConfig);
  const exportConfig = useValidationImportStore((s) => s.exportConfig);
  const previewImportConfig = useValidationImportStore((s) => s.previewImportConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const preview = previewImportConfig(text);
      if (!preview) {
        const fallback = importConfig(text);
        if (!fallback.success) {
          alert('导入失败：\n' + fallback.errors.join('\n'));
        }
      }
    };
    reader.onerror = () => {
      alert('文件读取失败');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `museum-guide-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-12 items-center gap-3 bg-museum-teal px-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-white" />
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          博物馆语音导览路线编排器
        </span>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <div className="relative group">
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>导入</span>
          </button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-48 rounded-md bg-white p-2 shadow-lg border border-slate-200">
            <div className="flex items-start gap-1.5 p-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-museum-teal shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-600 leading-snug">
                导入前将预览校验结果，需通过校验才能覆盖
              </span>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>导出</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>重置</span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Link
          to="/"
          className="rounded-md px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          主工作台
        </Link>
        <Link
          to="/plans"
          className="rounded-md px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          方案管理
        </Link>
        <Link
          to="/dispatch"
          className="rounded-md px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors flex items-center gap-1"
        >
          <BarChart3 size={12} />
          调度中心
        </Link>
      </div>
    </div>
  );
}
