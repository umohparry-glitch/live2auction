import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Truck, 
  Clock, 
  Package, 
  Eye, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MarketplaceOrder, MarketplaceDispute, DisputeReason } from '../types/marketplace';

export const OrdersEscrowCenter: React.FC = () => {
  const { 
    orders, 
    disputes, 
    payForOrder, 
    confirmBuyerInspectionAccept, 
    openDispute 
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'orders' | 'disputes'>('orders');
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<MarketplaceOrder | null>(null);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('significantly_not_as_described');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState<string | null>(null);

  const handlePay = async (orderId: string) => {
    setIsProcessingPay(orderId);
    await payForOrder(orderId);
    setIsProcessingPay(null);
  };

  const handleOpenDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispute || !disputeDescription.trim()) return;

    openDispute(selectedOrderForDispute.id, disputeReason, disputeDescription);
    setSelectedOrderForDispute(null);
    setDisputeDescription('');
    setActiveTab('disputes');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white text-slate-900">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>PAYSTACK / FLUTTERWAVE REGULATED ESCROW ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Escrow Settlement & Inspection Resolution Hub
          </h1>
          <p className="text-xs text-slate-500">
            Funds held securely until the 24-hour buyer inspection period lapses or buyer confirms receipt.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'orders' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Escrow Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'disputes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disputes & Resolutions ({disputes.length})
          </button>
        </div>
      </div>

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">ORDER #{order.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">Merchant: {order.sellerName}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{order.productTitle}</h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Escrow Amount</div>
                  <div className="text-xl font-black text-emerald-700 font-display">
                    ₦{order.totalPaid.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Hammer: ₦{order.hammerPrice.toLocaleString()} + Logistics: ₦{order.deliveryFee.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status Machine Bar (Section 21) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="uppercase">{order.paymentStatus}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Secured in Protected Vault</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics Dispatch</span>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="uppercase">{order.deliveryStatus.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{order.trackingNumber}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inspection Period</span>
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>24-Hour Active Window</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Auto-release upon timeout</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller Net Payout</span>
                  <div className="text-xs font-black text-emerald-700">
                    ₦{order.sellerPayoutAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">Less platform commission</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Address: <strong>{order.deliveryAddress}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'payment_pending' && (
                    <button
                      onClick={() => handlePay(order.id)}
                      disabled={isProcessingPay === order.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-2xs"
                    >
                      {isProcessingPay === order.id ? 'Connecting Gateway...' : `Fund Escrow (₦${order.totalPaid.toLocaleString()})`}
                    </button>
                  )}

                  {order.status === 'buyer_inspection' && (
                    <>
                      <button
                        onClick={() => setSelectedOrderForDispute(order)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs hover:bg-rose-50"
                      >
                        Open Dispute
                      </button>
                      <button
                        onClick={() => confirmBuyerInspectionAccept(order.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-2xs"
                      >
                        Accept Item & Release Payout
                      </button>
                    </>
                  )}

                  {order.status === 'completed' && (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Completed & Settled</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Disputes View */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl p-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No active disputes</h4>
              <p className="text-xs text-slate-500">All marketplace transactions have proceeded smoothly without contest.</p>
            </div>
          ) : (
            disputes.map(disp => (
              <div key={disp.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">DISPUTE #{disp.id}</span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">{disp.productTitle}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase">
                    {disp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p><strong>Reason:</strong> {disp.reason.replace(/_/g, ' ')}</p>
                  <p><strong>Buyer's Statement:</strong> {disp.description}</p>
                  {disp.adminDecision && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                      <strong>Admin Resolution:</strong> {disp.adminDecision}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Open Dispute Modal */}
      {selectedOrderForDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">Open Inspection Dispute</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDispute(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Opening a dispute pauses seller payout release immediately. Our verification team will review physical condition, photos, and serial IMEI records.
            </p>

            <form onSubmit={handleOpenDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="significantly_not_as_described">Item Significantly Not as Described</option>
                  <option value="damaged">Item Arrived Damaged / Cracked</option>
                  <option value="counterfeit_suspected">Suspected Counterfeit / Fake Serial</option>
                  <option value="missing_parts">Missing Declared Accessories</option>
                  <option value="wrong_product">Wrong Product Received</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description & Evidence</label>
                <textarea
                  rows={3}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Explain clearly why the lot doesn't match the listing..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDispute(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold shadow-xs"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
