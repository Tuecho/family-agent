import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X, Check, Lock } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { useAuth } from '../components/Auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  order_index: number;
}

export function FAQ() {
  const { isAdmin } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/faqs`);
      const data = await response.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      
      if (editingFaq) {
        const response = await fetch(`${API_URL}/api/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const error = await response.json();
          console.error('Error updating FAQ:', error);
          alert(error.error || 'Error al actualizar FAQ');
          return;
        }
      } else {
        await fetch(`${API_URL}/api/faqs`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
      }
      
      resetForm();
      fetchFaqs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const resetForm = () => {
    setFormData({ question: '', answer: '' });
    setEditingFaq(null);
    setShowModal(false);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer
    });
    setShowModal(true);
  };

  const deleteFaq = async (id: number) => {
    if (!window.confirm('¿Eliminar esta FAQ?')) return;
    
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/faqs/${id}`, { method: 'DELETE', headers });
      fetchFaqs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <HelpCircle className="text-primary" size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">FAQ</h2>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 sm:gap-2 bg-primary text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva FAQ</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700 text-sm">
          <Lock size={16} />
          Estás en modo administrador. Puedes añadir, editar y eliminar FAQs.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={faq.id}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(faq)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {openIndex === index ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </button>
              {openIndex === index && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-gray-600 text-sm sm:text-base">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAdmin && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
          <Lock size={16} className="inline mr-1" />
          Solo los administradores pueden editar las FAQs.
        </div>
      )}

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingFaq ? 'Editar FAQ' : 'Nueva FAQ'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregunta *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Escribe la pregunta..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respuesta *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Escribe la respuesta..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[100px] text-sm sm:text-base"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl hover:bg-primary/90 font-medium shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <Check size={16} />
                  {editingFaq ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
