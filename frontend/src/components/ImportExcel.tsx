import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ImportResult {
  success: boolean;
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  };
  details: {
    imported: any[];
    skipped: { row: number; reason: string }[];
    errors: { row: number; error: string }[];
  };
}

export function ImportExcel({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '.xlsx',
        '.xls'
      ];
      
      if (!validTypes.some(type => 
        selectedFile.name.endsWith(type) || 
        selectedFile.type.includes('excel') || 
        selectedFile.type.includes('spreadsheet')
      )) {
        setError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/import/excel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error importando archivo');
      }

      setResult(data);
      
      if (data.summary.imported > 0) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar archivo');
    } finally {
      setImporting(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-income text-white px-4 py-2 rounded-lg hover:bg-income/90 transition-colors"
        title="Importar desde Excel"
      >
        <Upload size={20} />
        Importar Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-income" size={24} />
                Importar desde Excel
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Formato esperado del archivo:</h4>
                <p className="text-sm text-blue-600">
                  El archivo debe tener las siguientes columnas en la primera fila:
                </p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                  <li><strong>Fecha</strong> - Formato: 01/03/2026 o 01-03-2026</li>
                  <li><strong>Tipo</strong> - Valores: "ingreso" o "gasto"</li>
                  <li><strong>Importe</strong> - Número (ej: 45.50)</li>
                  <li><strong>Descripción</strong> - Texto descriptivo</li>
                  <li><strong>Concepto</strong> - (Opcional) gasolina, comida, alquiler, servicios, ocio, otros</li>
                </ul>
              </div>

              {!result && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      file ? 'border-income bg-income/5' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileSpreadsheet className="text-income" size={32} />
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
                          Haz clic o arrastra un archivo Excel aquí
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          .xlsx o .xls
                        </p>
                      </>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-expense bg-expense/10 p-3 rounded-lg">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-800">{result.summary.total}</p>
                      <p className="text-sm text-gray-500">Total filas</p>
                    </div>
                    <div className="bg-income/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-income">{result.summary.imported}</p>
                      <p className="text-sm text-gray-500">Importadas</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</p>
                      <p className="text-sm text-gray-500">Omitidas</p>
                    </div>
                    <div className="bg-expense/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-expense">{result.summary.errors}</p>
                      <p className="text-sm text-gray-500">Errores</p>
                    </div>
                  </div>

                  {result.summary.imported > 0 && (
                    <div className="flex items-center gap-2 text-income bg-income/10 p-3 rounded-lg">
                      <CheckCircle size={20} />
                      <span>¡Importación completada con éxito!</span>
                    </div>
                  )}

                  {result.details.skipped.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2">Filas omitidas:</h4>
                      <div className="bg-yellow-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {result.details.skipped.map((s, i) => (
                          <div key={i} className="text-sm text-yellow-700">
                            Fila {s.row}: {s.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.details.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-expense mb-2">Errores:</h4>
                      <div className="bg-expense/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {result.details.errors.map((e, i) => (
                          <div key={i} className="text-sm text-expense">
                            Fila {e.row}: {e.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              {result ? (
                <>
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Importar otro archivo
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="flex-1 py-2 bg-income text-white rounded-lg hover:bg-income/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Importar
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
