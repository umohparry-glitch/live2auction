import React, { useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  ShieldCheck, 
  DollarSign, 
  Tag, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MarketplaceCategory } from '../types/marketplace';
import { aiAssistantService } from '../services/marketplaceServices';

interface SellItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: MarketplaceCategory[] = [
  'Phones',
  'Laptops',
  'Electronics',
  'Home Appliances',
  'Fashion',
  'Shoes',
  'Watches',
  'Gaming',
  'Furniture',
  'Tools',
  'Solar & Power',
  'Auto Accessories',
  'Other Approved Products'
];

export const SellItemModal: React.FC<SellItemModalProps> = ({ isOpen, onClose }) => {
  const { createProduct } = useMarketplace();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('Phones');
  const [condition, setCondition] = useState<'Brand New' | 'Open Box' | 'Refurbished' | 'Fairly Used'>('Brand New');
  const [startingPrice, setStartingPrice] = useState('100000');
  const [reservePrice, setReservePrice] = useState('');
  const [bidIncrement, setBidIncrement] = useState('5000');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Ikeja, Lagos');
  const [warranty, setWarranty] = useState('1 Year Standard Warranty');
  const [serialNumber, setSerialNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);

  if (!isOpen) return null;

  // AI Assistant (Section 44 & 45)
  const handleGenerateAiSuggestions = () => {
    setIsAiSuggesting(true);
    setTimeout(() => {
      const res = aiAssistantService.suggestListingDetails(title || 'Sample item', category);
      setAiSuggestions(res);
      if (!description) setDescription(res.suggestedDescription);
      if (!startingPrice || startingPrice === '100000') setStartingPrice(res.suggestedStartingPrice.toString());
      setBidIncrement(res.recommendedIncrement.toString());
      setIsAiSuggesting(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createProduct({
      title: title.trim(),
      category,
      condition,
      startingPrice: parseFloat(startingPrice) || 50000,
      reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
      bidIncrement: parseFloat(bidIncrement) || 5000,
      description,
      productLocation: location,
      warrantyInfo: warranty,
      serialNumber,
      images: imageUrl.trim() ? [imageUrl.trim()] : [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
      ]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Submit Product Lot for Verification & Auction
              </h2>
              <p className="text-xs text-slate-500">
                Accredited seller submission flow with AI pricing and inspection review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* AI Listing Assistant Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Use AI to estimate market value, suggest starting bid, and generate description.</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateAiSuggestions}
              disabled={isAiSuggesting}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              {isAiSuggesting ? 'Analyzing...' : 'AI Assist'}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apple iPhone 15 Pro Max 256GB Natural Titanium"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Brand New">Brand New (Sealed)</option>
                <option value="Open Box">Open Box (A+ Grade)</option>
                <option value="Refurbished">Certified Refurbished</option>
                <option value="Fairly Used">Clean Fairly Used</option>
              </select>
            </div>
          </div>

          {/* Pricing Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Starting Bid (₦)</label>
              <input
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reserve Price (₦)</label>
              <input
                type="number"
                placeholder="Optional"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bid Increment (₦)</label>
              <input
                type="number"
                value={bidIncrement}
                onChange={(e) => setBidIncrement(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                required
              />
            </div>
          </div>

          {/* Location & Serial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Otigba St, Computer Village, Ikeja"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial / IMEI (For Verification)</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. 354890****0129"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Image URL (or uncheck to use stock photo)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Item Description & Disclosures</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specifications, warranty, included accessories, and any cosmetic disclosures..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              required
            />
          </div>

          {/* Verification Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All lots undergo inspection review by Platform Admins before the timed auction begins.</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs"
            >
              Submit for Verification
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
