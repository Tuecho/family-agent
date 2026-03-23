import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { useStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ExtractedData {
  concept: string;
  amount: number;
  date: string;
  description: string;
  rawText: string;
}

interface ImportPDFProps {
  onImportComplete: () => void;
}

const conceptLabels: Record<string, string> = {
  gasolina: '⛽ Gasolina',
  comida: '🛒 Comida',
  alquiler: '🏠 Alquiler',
  servicios: '💡 Servicios',
  ocio: '🎮 Ocio',
  restaurantes: '🍽️ Restaurantes',
  transporte: '🚗 Transporte',
  salud: '💊 Salud',
  ropa: '👕 Ropa',
  hogar: '🏠 Hogar',
  otros: '📦 Otros'
};

export function ImportPDF({ onImportComplete }: ImportPDFProps) {
  const { concepts } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    concept: 'comida',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conceptLabelByKey = concepts.reduce((acc, c) => {
    acc[c.key] = c.label;
    return acc;
  }, {} as Record<string, string>);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, selecciona un archivo PDF válido (.pdf)');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setExtracted(null);
      processPDF(selectedFile);
    }
  };

  const processPDF = async (fileToProcess: File) => {
    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', fileToProcess);

    try {
      const response = await fetch(`${API_URL}/api/import/pdf`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error procesando PDF');
      }

      setExtracted(data.extracted);
      setTransactionData({
        type: 'expense',
        amount: data.extracted.amount > 0 ? String(data.extracted.amount) : '',
        description: data.extracted.description || '',
        concept: data.extracted.concept || 'comida',
        date: data.extracted.date || new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!transactionData.amount || !transactionData.description) {
      setError('La cantidad y descripción son obligatorias');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          description: transactionData.description,
          concept: transactionData.type === 'expense' ? transactionData.concept : undefined,
          date: transactionData.date
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando transacción');
      }

      onImportComplete();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
    setExtracted(null);
    setError(null);
    setTransactionData({
      type: 'expense',
      amount: '',
      description: '',
      concept: 'comida',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        title="Importar desde PDF"
      >
        <FileText size={20} />
        Importar PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-purple-500" size={24} />
                Importar desde PDF
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">¿Cómo funciona?</h4>
                <p className="text-sm text-purple-600">
                  Sube un PDF (factura, recibo, ticket...) y extraeremos automáticamente el concepto, importe y fecha. 
                  Podrás revisar y editar los datos antes de guardar.
                </p>
              </div>

              {!extracted && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      file ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="text-purple-500" size={32} />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                        <p className="text-gray-600">
                          Haz clic o arrastra un archivo PDF aquí
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          .pdf
                        </p>
                      </>
                    )}
                  </div>

                  {processing && (
                    <div className="flex items-center justify-center gap-3 text-purple-600">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Procesando PDF...</span>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-expense bg-expense/10 p-3 rounded-lg">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {extracted && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <p className="font-medium text-green-800">¡Datos extraídos!</p>
                      <p className="text-sm text-green-600">Revisa y ajusta los datos si es necesario</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTransactionData({ ...transactionData, type: 'expense' })}
                          className={`flex-1 py-2 rounded-lg transition-colors ${
                            transactionData.type === 'expense'
                              ? 'bg-expense text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Gasto
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionData({ ...transactionData, type: 'income' })}
                          className={`flex-1 py-2 rounded-lg transition-colors ${
                            transactionData.type === 'income'
                              ? 'bg-income text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Ingreso
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={transactionData.date}
                        onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionData.amount}
                      onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={transactionData.description}
                      onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Descripción de la transacción"
                    />
                  </div>

                  {transactionData.type === 'expense' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Concepto detectado: <span className="text-purple-600">{conceptLabels[extracted.concept] || extracted.concept}</span></label>
                      <select
                        value={transactionData.concept}
                        onChange={(e) => setTransactionData({ ...transactionData, concept: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {concepts.map((c) => (
                          <option key={c.key} value={c.key}>{conceptLabelByKey[c.key] || c.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-expense bg-expense/10 p-3 rounded-lg">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {extracted && (
                <button
                  onClick={handleSave}
                  disabled={saving || !transactionData.amount || !transactionData.description}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Guardar transacción
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
