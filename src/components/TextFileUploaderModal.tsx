import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  HelpCircle, 
  Code, 
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { parseProductTextFile, ParsedTextItem } from '../utils/textFileParser';
import { SAMPLE_TEXT_FILE_CONTENT } from '../data/mockData';
import { useLiveAuction } from '../context/LiveAuctionContext';

interface TextFileUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextFileUploaderModal: React.FC<TextFileUploaderModalProps> = ({ isOpen, onClose }) => {
  const { 
    categoryRooms, 
    activeRoomId, 
    activeSlotId, 
    importProductsToSlot 
  } = useLiveAuction();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(activeRoomId);
  const selectedRoom = categoryRooms.find(r => r.id === selectedRoomId) || categoryRooms[0];
  const [selectedSlotId, setSelectedSlotId] = useState<string>(activeSlotId);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedTextItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process text content
  const handleProcessText = (content: string, name?: string) => {
    setRawText(content);
    if (name) setFileName(name);
    const { items, errors } = parseProductTextFile(content);
    setParsedItems(items);
    setParseErrors(errors);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Load sample text
  const handleLoadSample = () => {
    handleProcessText(SAMPLE_TEXT_FILE_CONTENT, 'sample-nigerian-auctions.txt');
    setActiveTab('paste');
  };

  // Submit to Live Auction Queue
  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    importProductsToSlot(selectedRoomId, selectedSlotId, parsedItems, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Upload Live Auction Product Text File
              </h2>
              <p className="text-xs text-slate-500">
                Batch import products, prices, and catalog queues via .txt or .csv
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher & Sample template button */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 transition border-b-2 ${
                activeTab === 'upload' 
                  ? 'border-emerald-600 text-emerald-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload / Drag & Drop File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 transition border-b-2 ${
                activeTab === 'paste' 
                  ? 'border-emerald-600 text-emerald-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Direct Text Editor
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pb-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Text Template</span>
          </button>
        </div>

        {/* Target Room & Slot Selection Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Category Live Room:
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                const newRoomId = e.target.value;
                setSelectedRoomId(newRoomId);
                const targetR = categoryRooms.find(r => r.id === newRoomId);
                if (targetR && targetR.slots.length > 0) {
                  setSelectedSlotId(targetR.slots[0].id);
                }
              }}
              className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {categoryRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.icon} {room.title} ({room.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Daily Auction Slot:
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {selectedRoom.slots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.code}: {slot.name} ({slot.targetItemCount} items target)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {activeTab === 'upload' ? (
            /* Drag and Drop Zone */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-emerald-600 bg-emerald-50/50' 
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.tsv,.json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {fileName ? fileName : 'Choose a text file or drag & drop it here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports plain text (.txt), CSV (.csv), tab-separated values (.tsv), or JSON format
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs">
                Browse File
              </span>
            </div>
          ) : (
            /* Direct Text Input */
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Catalog Text (Pipe or Comma Delimited):
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => handleProcessText(e.target.value)}
                placeholder="Title | Starting Price | Bid Increment | Category | Condition | Est Market Value | Location"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                Format: <code className="text-slate-600">Title | StartingPrice | Increment | Category | Condition | MarketValue | Location</code>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Parsed Products Ready For Import ({parsedItems.length} items)</span>
                </h4>
                <button
                  onClick={() => {
                    setParsedItems([]);
                    setFileName(null);
                    setRawText('');
                  }}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5">Product Title</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Start Price</th>
                      <th className="p-2.5">Increment</th>
                      <th className="p-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 truncate max-w-[180px]">
                          {item.title}
                        </td>
                        <td className="p-2.5 text-slate-600">{item.category}</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">
                          ₦{item.startingPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          +₦{item.bidIncrement.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-slate-500">{item.sellerLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Selector */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800">Queue Action:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700">Append to Current Queue</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700">Replace Entire Queue</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error messages if any */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Warnings in text file:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <span>Load {parsedItems.length} Products Into Live Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
