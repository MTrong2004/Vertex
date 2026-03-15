import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Users, BarChart, Sparkles } from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    members: 4,
    deadline: '',
    detailLevel: 'medium'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      onSubmit(formData);
      onClose();
      // Reset form
      setStep(1);
      setFormData({ name: '', members: 4, deadline: '', detailLevel: 'medium' });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-[#0F1A2A]/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg overflow-hidden border border-[#22C55E]/10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between bg-[#0A0F1A]">
            <div className="flex items-center gap-2 text-[#22C55E]">
              <Sparkles size={20} />
              <h3 className="font-bold text-lg text-white">Create project plan with AI</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#22C55E]/20 border-t-[#22C55E] animate-spin mb-4"></div>
                <h4 className="text-lg font-bold text-white mb-2">Creating plan...</h4>
                <p className="text-slate-400">AI is analyzing your request and breaking down tasks for your team.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Project name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="E.g.: Poster Design, TikTok Video..."
                      className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Team size</label>
                      <div className="relative">
                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="number" 
                          min="1"
                          max="20"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
                          value={formData.members}
                          onChange={(e) => setFormData({...formData, members: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="date" 
                          required
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Detail level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['low', 'medium', 'high'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, detailLevel: level})}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                            formData.detailLevel === level 
                              ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]' 
                              : 'border-[#22C55E]/10 text-slate-400 hover:bg-[#162032]'
                          }`}
                        >
                          {level === 'low' ? 'Basic' : level === 'medium' ? 'Detailed' : 'Very detailed'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button type="submit" variant="primary">Create plan now</Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
